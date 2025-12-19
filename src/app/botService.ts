// src/botService.ts
import * as admin from 'firebase-admin';
import { FirebaseService } from './firebaseService';
import { Bot, BotSessionState } from './interfaces';

export class BotService {
    private firestore: admin.firestore.Firestore;
    private realtimeDb: admin.database.Database;
    private botsCollection: admin.firestore.CollectionReference<Bot>;
    private botSessionsRef: admin.database.Reference; // For Realtime DB bot state

    constructor() {
        const firebase = FirebaseService.getInstance();
        this.firestore = firebase.firestore;
        this.realtimeDb = firebase.realtimeDb;
        this.botsCollection = this.firestore.collection('users') as admin.firestore.CollectionReference<Bot>; // Will be /users/{userId}/bots/{botId}
        this.botSessionsRef = this.realtimeDb.ref('botSessions'); // /botSessions/{botId}/currentState
    }

    /**
     * Creates a new bot in Firestore.
     * @param userId The ID of the user owning the bot.
     * @param botData The bot data.
     * @returns The created bot with its Firestore ID.
     */
    async createBot(userId: string, botData: Omit<Bot, 'id' | 'dateCreated' | 'dateUpdated'>): Promise<Bot> {
        try {
            const now = admin.firestore.Timestamp.now();
            const botRef = await this.firestore.collection(`users/${userId}/bots`).add({
                ...botData,
                dateCreated: now,
                dateUpdated: now,
            });
            const newBot: Bot = { id: botRef.id, ...botData, dateCreated: now, dateUpdated: now };

            // Initialize Realtime DB state for the new bot if needed, or simply update status
            await this.updateBotStatusInRealtimeDb(newBot.id!, newBot.status, newBot.isActive);

            return newBot;
        } catch (error) {
            console.error('Error creating bot:', error);
            throw new Error('Failed to create bot.');
        }
    }

    /**
     * Retrieves a bot by its ID for a specific user from Firestore.
     * @param userId The ID of the user.
     * @param botId The ID of the bot.
     * @returns The bot, or null if not found.
     */
    async getBot(userId: string, botId: string): Promise<Bot | null> {
        try {
            const botDoc = await this.firestore.doc(`users/${userId}/bots/${botId}`).get();
            if (!botDoc.exists) {
                return null;
            }
            return { id: botDoc.id, ...(botDoc.data() as Omit<Bot, 'id'>) };
        } catch (error) {
            console.error('Error getting bot:', error);
            throw new Error('Failed to retrieve bot.');
        }
    }

    /**
     * Updates an existing bot in Firestore.
     * @param userId The ID of the user owning the bot.
     * @param botId The ID of the bot to update.
     * @param updates Partial bot data to update.
     * @returns True if successful, false otherwise.
     */
    async updateBot(userId: string, botId: string, updates: Partial<Omit<Bot, 'id' | 'dateCreated'>>): Promise<boolean> {
        try {
            const botRef = this.firestore.doc(`users/${userId}/bots/${botId}`);
            await botRef.update({
                ...updates,
                dateUpdated: admin.firestore.Timestamp.now(),
            });

            // Crucial: If status or isActive is updated, reflect this in Realtime DB.
            if (updates.status !== undefined || updates.isActive !== undefined) {
                // Fetch current values if not provided in updates
                const currentBot = await this.getBot(userId, botId);
                if (currentBot) {
                    const newStatus = updates.status ?? currentBot.status;
                    const newIsActive = updates.isActive ?? currentBot.isActive;
                    await this.updateBotStatusInRealtimeDb(botId, newStatus, newIsActive);
                }
            }
            return true;
        } catch (error) {
            console.error('Error updating bot:', error);
            throw new Error('Failed to update bot.');
        }
    }

    /**
     * Deletes a bot from Firestore.
     * @param userId The ID of the user.
     * @param botId The ID of the bot to delete.
     * @returns True if successful, false otherwise.
     */
    async deleteBot(userId: string, botId: string): Promise<boolean> {
        try {
            await this.firestore.doc(`users/${userId}/bots/${botId}`).delete();
            // Also remove its state from Realtime DB
            await this.botSessionsRef.child(botId).remove();
            return true;
        } catch (error) {
            console.error('Error deleting bot:', error);
            throw new Error('Failed to delete bot.');
        }
    }

    /**
     * Updates the real-time bot session state (metrics) in Realtime Database.
     * This is for displaying current stats.
     * @param botSessionState The current state of the bot session.
     */
    async updateBotSessionState(botSessionState: Omit<BotSessionState, 'lastUpdated'>): Promise<void> {
        try {
            await this.botSessionsRef.child(botSessionState.botId).set({
                ...botSessionState,
                lastUpdated: admin.database.ServerValue.TIMESTAMP,
            });
        } catch (error) {
            console.error('Error updating bot session state in Realtime DB:', error);
            throw new Error('Failed to update bot session state.');
        }
    }

    /**
     * Helper to mirror bot status and isActive from Firestore to Realtime DB.
     * This would typically be triggered by a Cloud Function on Firestore `onUpdate`.
     * For demonstration, we call it directly after Firestore updates.
     * @param botId The ID of the bot.
     * @param status The new status.
     * @param isActive The new isActive status.
     */
    private async updateBotStatusInRealtimeDb(botId: string, status: Bot['status'], isActive: Bot['isActive']): Promise<void> {
        try {
            // Store under a separate path for just status if desired, or within session state
            await this.realtimeDb.ref(`botDisplayStatus/${botId}`).update({
                status: status,
                isActive: isActive,
                lastStatusUpdate: admin.database.ServerValue.TIMESTAMP,
            });
        } catch (error) {
            console.error('Error updating bot status in Realtime DB:', error);
            // Do not re-throw, as this is a secondary update to a "mirror"
        }
    }
}
