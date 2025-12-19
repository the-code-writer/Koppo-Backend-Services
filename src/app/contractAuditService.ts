// src/contractAuditService.ts
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebaseService';
import { ContractAudit, TradeStreak } from './interfaces';

export class ContractAuditService {
    private firestore: admin.firestore.Firestore;
    private auditCollection: admin.firestore.CollectionReference<ContractAudit>;

    constructor() {
        const firebase = FirebaseService.getInstance();
        this.firestore = firebase.firestore;
        this.auditCollection = this.firestore.collection('contractAudits') as admin.firestore.CollectionReference<ContractAudit>;
    }

    /**
     * Adds a new contract audit record to Firestore.
     * @param auditData The data for the contract audit.
     * @returns The created audit record with its Firestore ID.
     */
    async addContractAudit(auditData: Omit<ContractAudit, 'id' | 'timestamp'>): Promise<ContractAudit> {
        try {
            const now = admin.firestore.Timestamp.now();
            const auditRef = await this.auditCollection.add({
                ...auditData,
                timestamp: now,
            });
            return { id: auditRef.id, ...auditData, timestamp: now };
        } catch (error) {
            console.error('Error adding contract audit:', error);
            throw new Error('Failed to add contract audit.');
        }
    }

    /**
     * Retrieves contract audit records based on various filters.
     * @param filters An object containing optional filters (userId, botId, sessionId, strategyUsed).
     * @returns An array of matching contract audit records.
     */
    async getAudits(filters: {
        userId?: string;
        botId?: string;
        sessionId?: string;
        strategyUsed?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<ContractAudit[]> {
        try {
            let query: admin.firestore.Query<ContractAudit> = this.auditCollection;

            if (filters.userId) query = query.where('userId', '==', filters.userId);
            if (filters.botId) query = query.where('botId', '==', filters.botId);
            if (filters.sessionId) query = query.where('sessionId', '==', filters.sessionId);
            if (filters.strategyUsed) query = query.where('strategyUsed', '==', filters.strategyUsed);
            if (filters.startDate) query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startDate));
            if (filters.endDate) query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endDate));

            query = query.orderBy('timestamp', 'asc'); // Always order for streak analysis

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data()) }));
        } catch (error) {
            console.error('Error getting contract audits:', error);
            throw new Error('Failed to retrieve contract audits.');
        }
    }

    /**
     * Analyzes a list of contract audits to find the longest winning and losing streaks.
     * @param audits An array of contract audit records, assumed to be chronologically ordered.
     * @returns An object containing the longest winning and losing streaks.
     */
    analyzeStreaks(audits: ContractAudit[]): { longestWinningStreak: TradeStreak | null; longestLosingStreak: TradeStreak | null } {
        let currentWinningStreak: TradeStreak | null = null;
        let currentLosingStreak: TradeStreak | null = null;
        let longestWinningStreak: TradeStreak | null = null;
        let longestLosingStreak: TradeStreak | null = null;

        for (const audit of audits) {
            if (audit.tradeOutcome === 'WIN') {
                if (currentWinningStreak) {
                    currentWinningStreak.length++;
                    currentWinningStreak.endTimestamp = audit.timestamp;
                    currentWinningStreak.trades.push(audit);
                } else {
                    currentWinningStreak = {
                        type: 'WIN',
                        length: 1,
                        startTimestamp: audit.timestamp,
                        endTimestamp: audit.timestamp,
                        trades: [audit],
                    };
                }
                currentLosingStreak = null; // Reset losing streak
            } else if (audit.tradeOutcome === 'LOSS') {
                if (currentLosingStreak) {
                    currentLosingStreak.length++;
                    currentLosingStreak.endTimestamp = audit.timestamp;
                    currentLosingStreak.trades.push(audit);
                } else {
                    currentLosingStreak = {
                        type: 'LOSS',
                        length: 1,
                        startTimestamp: audit.timestamp,
                        endTimestamp: audit.timestamp,
                        trades: [audit],
                    };
                }
                currentWinningStreak = null; // Reset winning streak
            }

            // Update longest streaks
            if (currentWinningStreak && (!longestWinningStreak || currentWinningStreak.length > longestWinningStreak.length)) {
                longestWinningStreak = { ...currentWinningStreak }; // Deep copy
            }
            if (currentLosingStreak && (!longestLosingStreak || currentLosingStreak.length > longestLosingStreak.length)) {
                longestLosingStreak = { ...currentLosingStreak }; // Deep copy
            }
        }

        return { longestWinningStreak, longestLosingStreak };
    }
}