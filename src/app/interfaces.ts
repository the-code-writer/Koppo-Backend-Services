// src/interfaces.ts
import * as admin from 'firebase-admin';

console.log("XXXXXXX")

/**
 * Interface for a user-defined trading bot.
 * This is the primary source of truth for bot configuration, stored in Firestore.
 */
export interface Bot {
    id?: string; // Firestore document ID
    userId: string;
    botName: string;
    contractType: 'CALL' | 'PUT' | 'DIGITMATCH' | 'DIGITDIFF' | 'TURBOS' | 'NON_TURBOS' | string; // Broadened for flexibility
    initialStake: number;
    duration: number;
    durationUnits: 'TICK' | 'SECONDS' | 'MINUTES' | 'HOURS' | 'DAYS';
    repeatTrade: boolean;
    contractSymbol: string;
    dateCreated: admin.firestore.Timestamp;
    version: string;
    dateUpdated: admin.firestore.Timestamp;
    status: 'STOPPED' | 'PAUSED' | 'RUNNING' | 'INITIALIZING';
    isActive: boolean;
}

/**
 * Interface for the current, volatile state of a bot session.
 * This is stored in Realtime Database for low-latency, real-time updates (display/processing).
 */
export interface BotSessionState {
    botId: string;
    sessionId: string; // Unique ID for the current bot run
    numberOfRuns: number;
    numberOfWins: number;
    numberOfLosses: number;
    totalPayout: number;
    totalStake: number;
    totalProfit: number;
    commisionPayout: number;
    realCommissionPayout: number;
    currentStrategy: string;
    lastUpdated: any;  //admin.database.ServerTimestamp; // Realtime DB Server Timestamp
}

/**
 * Interface for a single contract audit record (a "trade" or "bet").
 * This forms the historical audit trail, stored in Firestore.
 */
export interface ContractAudit {
    id?: string; // Firestore document ID
    timestamp: admin.firestore.Timestamp;
    userId: string;
    botId: string;
    sessionId: string; // ID for the bot session this trade belongs to
    strategyUsed: string;
    proposal: number;
    amount: number; // Stake amount for this contract
    basis: string; // e.g., 'stake', 'payout'
    contract_type: string;
    currency: string;
    duration: number;
    duration_unit: string;
    symbol: string;
    barrier?: number; // Optional barrier for certain contract types
    tradeOutcome: 'WIN' | 'LOSS' | 'PENDING';
    profitOrLoss: number; // Actual P/L for this specific trade (positive for win, negative for loss)
}

/**
 * Represents a streak (winning or losing).
 */
export interface TradeStreak {
    type: 'WIN' | 'LOSS';
    length: number;
    startTimestamp: admin.firestore.Timestamp;
    endTimestamp: admin.firestore.Timestamp;
    trades: ContractAudit[]; // Optional: store the actual trades in the streak
}
