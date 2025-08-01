import { bot } from './telegramBot';
import { session } from 'telegraf';
import express, { Request, Response } from 'express';

const app = express();

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
    res.send('Bot is alive!');
});

// Handle bot launch with retries
const startBot = async (retryCount = 0) => {
    try {
        console.log('Starting bot...');
        
        // Add error handler before launching
        bot.catch((err: any) => {
            console.error('Bot error:', err);
            if (err.description === 'Conflict: terminated by other getUpdates request') {
                console.log('Bot conflict detected, attempting to restart...');
                setTimeout(async () => {
                    try {
                        await bot.stop();
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                        await bot.telegram.deleteWebhook();
                        await bot.launch();
                    } catch (error) {
                        console.error('Failed to restart bot:', error);
                        process.exit(1);
                    }
                }, 1000);
            }
        });

        // Launch the bot
        await bot.launch();
        console.log('Bot started successfully');

        // Enable graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
    } catch (error: any) {
        console.error('Failed to start bot:', error);
        
        if (error.description === 'Conflict: terminated by other getUpdates request' && retryCount < 3) {
            console.log(`Retrying in 15 seconds... (Attempt ${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 15000));
            return startBot(retryCount + 1);
        }
        
        console.error('Max retries reached or fatal error. Exiting...');
        process.exit(1);
    }
};

// Start both the bot and Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Health check server running on port ${PORT}`);
    // Start the bot after the server is running
    startBot();
}); 