// app.ts (Example usage in your backend logic)
import { BotService } from './botService';
import { ContractAuditService } from './contractAuditService';
import { BotSessionState } from './interfaces';
import * as admin from 'firebase-admin';

// Initialize services
const botService = new BotService();
const auditService = new ContractAuditService();

async function runBotProcess() {
    const userId = 'user123';
    const botId = 'botABC'; // Assuming an existing bot

    console.log(userId, botId)

    // 1. Create a new bot (if not existing)
    try {
        const newBot = await botService.createBot(userId, {
            userId,
            botName: 'MyAwesomeBot',
            contractType: 'CALL',
            initialStake: 10,
            duration: 5,
            durationUnits: 'TICK',
            repeatTrade: true,
            contractSymbol: 'R_100',
            version: '1.0.0',
            status: 'INITIALIZING',
            isActive: false,
        });
        console.log('Created Bot:', newBot);

        // 2. Update bot status to running
        await botService.updateBot(userId, newBot.id!, { status: 'RUNNING', isActive: true });
        console.log(`Bot ${newBot.id} is now RUNNING.`);

        const sessionId = `session-${Date.now()}`; // Generate a unique session ID

        // 3. Simulate bot trading loop
        let currentSessionState: BotSessionState = {
            botId: newBot.id!,
            sessionId: sessionId,
            numberOfRuns: 0,
            numberOfWins: 0,
            numberOfLosses: 0,
            totalPayout: 0,
            totalStake: 0,
            totalProfit: 0,
            commisionPayout: 0,
            realCommissionPayout: 0,
            currentStrategy: 'MartingaleV1',
            lastUpdated: admin.database.ServerValue.TIMESTAMP, // Placeholder, will be replaced by RTDB
        };

        for (let i = 0; i < 5; i++) { // Simulate 5 trades
            // (Simulate 8-second trade process)
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

            const isWin = Math.random() > 0.5; // Simulate win/loss
            const profitOrLoss = isWin ? 5 : -5;
            const amountStaked = 10;

            // Update current session state
            currentSessionState.numberOfRuns++;
            if (isWin) currentSessionState.numberOfWins++; else currentSessionState.numberOfLosses++;
            currentSessionState.totalStake += amountStaked;
            currentSessionState.totalProfit += profitOrLoss;
            currentSessionState.totalPayout += (isWin ? (amountStaked + profitOrLoss) : 0); // Simplified

            await botService.updateBotSessionState(currentSessionState);
            console.log('Updated Realtime DB State:', currentSessionState);

            // Add audit trail for the trade
            await auditService.addContractAudit({
                userId: userId,
                botId: newBot.id!,
                sessionId: sessionId,
                strategyUsed: currentSessionState.currentStrategy,
                proposal: 1, // Example
                amount: amountStaked,
                basis: 'stake',
                contract_type: newBot.contractType,
                currency: 'USD',
                duration: newBot.duration,
                duration_unit: newBot.durationUnits,
                symbol: newBot.contractSymbol,
                barrier: 1.23, // Example
                tradeOutcome: isWin ? 'WIN' : 'LOSS',
                profitOrLoss: profitOrLoss,
            });
            console.log('Added Firestore Audit for Trade:', i + 1);
        }

        // 4. Analyze data for AI strategies
        console.log('\n--- Analyzing Audit Data ---');
        const allAuditsForBot = await auditService.getAudits({ botId: newBot.id!, userId: userId });
        console.log(`Total audits for bot ${newBot.botName}: ${allAuditsForBot.length}`);

        const filteredAudits = await auditService.getAudits({
            userId: userId,
            botId: newBot.id!,
            strategyUsed: 'MartingaleV1',
            // startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        });
        console.log(`Audits for strategy 'MartingaleV1': ${filteredAudits.length}`);

        const { longestWinningStreak, longestLosingStreak } = auditService.analyzeStreaks(filteredAudits);
        console.log('Longest Winning Streak:', longestWinningStreak ? `${longestWinningStreak.length} trades` : 'None');
        console.log('Longest Losing Streak:', longestLosingStreak ? `${longestLosingStreak.length} trades` : 'None');

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Graceful shutdown or mark bot as stopped
        // await botService.updateBot(userId, botId, { status: 'STOPPED', isActive: false });
    }
}

 runBotProcess(); // Uncomment to run the example