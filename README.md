<!-- ReadMe file -->

# Bundler Bot

Bundler Bot is a Telegram bot that detects and notifies you about newly launched tokens on Ethereum (ETH), Binance Smart Chain (BSC), and Solana (SOL) networks.

## Features

- Detects new tokens on ETH, BSC, and SOL.
- Notifies you via Telegram with token details and Dex Screener links.
- Allows you to select which networks to scan.
- Health check endpoint for uptime monitoring.

## Prerequisites

- Node.js (v16 or higher recommended)
- A Telegram bot token ([How to get one](https://core.telegram.org/bots#how-do-i-create-a-bot))
- API keys for:
  - QuickNode (for ETH/BSC)
  - Shyft (for SOL)
- Your Telegram user ID (for notifications)

## Setup

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd BundlerBot
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Create a `.env` file in the project root with the following content:**
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   OWNER_CHAT_ID=your_telegram_user_id
   QUICKNODE_KEY=your_quicknode_key
   SHYFT_KEY=your_shyft_key
   ```

   - Replace `your_telegram_bot_token` with your Telegram bot token.
   - Replace `your_telegram_user_id` with your Telegram user ID.
   - Replace `your_quicknode_key` with your QuickNode API key.
   - Replace `your_shyft_key` with your Shyft API key.

4. **Start the bot:**
   ```sh
   npm start
   ```

   The bot will start and the health check server will run on port 3000 by default.

## Usage

- Open Telegram and start a chat with your bot.
- Use the provided keyboard to:
  - Start or stop the Bundler Bot.
  - Select which networks to scan.
- The bot will notify you of new tokens that match the criteria.

## Health Check

- Visit [http://localhost:3000/](http://localhost:3000/) to check if the bot is running.

## Customization

- You can adjust token detection criteria in `enhancedTokenScanner.ts` (e.g., minimum liquidity, volume, etc.).
- Network selection and other options are available via the Telegram bot interface.

## Troubleshooting

- Ensure your `.env` file is correctly set up.
- Check the console for error messages if the bot fails to start.
- Make sure your API keys are valid and have sufficient access.

---

Feel free to modify this README as needed for your specific deployment or additional features!