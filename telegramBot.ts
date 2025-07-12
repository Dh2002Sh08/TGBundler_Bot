import { Telegraf, Markup, session } from 'telegraf';
import dotenv from 'dotenv';
import { EnhancedTokenScanner, TokenData, TokenValidationCriteria } from './enhancedTokenScanner';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// --- Minimal Keyboards ---
const mainKeyboard = Markup.keyboard([
  ['🚦 Start Bundler Bot', '🛑 Stop Bundler Bot'],
  ['🌐 Select Networks']
]).resize();

const networkKeyboard = Markup.keyboard([
  ['🔷 ETH', '🟡 BSC', '🟣 SOL', '🔄 ALL'],
  ['🔙 Back to Main']
]).resize();

// --- State ---
// let scanner: EnhancedTokenScanner | null = null;
// let activeNetworks: ('ETH' | 'BSC' | 'SOL')[] = ['ETH', 'BSC', 'SOL'];
// let isScannerRunning = false;

// Per-user state
interface UserSession {
  scanner: EnhancedTokenScanner | null;
  activeNetworks: ('ETH' | 'BSC' | 'SOL')[];
  isScannerRunning: boolean;
}
const userSessions: Map<number, UserSession> = new Map();

// --- Token Notification Handler ---
async function notifyNewToken(token: TokenData, chatId: number) {
  let networkEmoji = '';
  let networkLabel = '';
  switch (token.network) {
    case 'BSC':
      networkEmoji = '🟡';
      networkLabel = '<b>BSC</b>';
      break;
    case 'ETH':
      networkEmoji = '🔷';
      networkLabel = '<b>ETH</b>';
      break;
    case 'SOL':
      networkEmoji = '🟣';
      networkLabel = '<b>SOL</b>';
      break;
  }
  const msg = `${networkEmoji} ${networkLabel}  <b>New Token Detected!</b>\n\n` +
    `🔹 <b>Name:</b> <code>${token.name}</code>\n` +
    `🔸 <b>Symbol:</b> <code>${token.symbol}</code>\n` +
    `💲 <b>Price:</b> <b>$${token.price}</b>\n` +
    `💧 <b>Liquidity:</b> <b>$${token.liquidity}</b>\n` +
    `📊 <b>Volume 24h:</b> <b>$${token.volume24h}</b>\n` +
    `⏳ <b>Age:</b> <code>${token.age}</code>\n` +
    `🔗 <b>Pair:</b> <a href="${token.dexScreenerUrl}">${token.pairAddress}</a>\n` +
    `🧭 <b>Dex Screener:</b> <a href="${token.dexScreenerUrl}">View Chart</a>`;
  await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML' });
}

// --- Start/Stop Scanner Logic ---
async function startScanner(ctx: any) {
  const userId = ctx.from.id;
  let session = userSessions.get(userId);
  if (!session) {
    session = {
      scanner: null,
      activeNetworks: ['ETH', 'BSC', 'SOL'],
      isScannerRunning: false
    };
    userSessions.set(userId, session);
  }
  if (session.isScannerRunning) {
    await ctx.reply('Bundler Bot is already running.', mainKeyboard);
    return;
  }
  // Default criteria (customize as needed)
  const criteria: TokenValidationCriteria = {
    minLiquidity: 1000,
    minVolume: 25,
    requireDexScreener: true,
    enableHoneypotDetection: false,
    excludeStablecoins: true,
    minTokenAge: 0,
    maxTokenAge: 86400 // 1 day
  };
  session.scanner = new EnhancedTokenScanner(
    criteria,
    async (token) => {
      await notifyNewToken(token, ctx.chat.id);
    },
    (error) => {
      console.error('Scanner error:', error);
      ctx.reply('❌ Scanner error: ' + error.message);
    }
  );
  await session.scanner.initialize();
  await session.scanner.startScanning(session.activeNetworks);
  session.isScannerRunning = true;
  await ctx.reply('🚦 Bundler Bot started!', mainKeyboard);
}

async function stopScanner(ctx: any) {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);
  if (!session || !session.isScannerRunning || !session.scanner) {
    await ctx.reply('Bundler Bot is not running.', mainKeyboard);
    return;
  }
  await session.scanner.stopScanning();
  session.scanner = null;
  session.isScannerRunning = false;
  await ctx.reply('🛑 Bundler Bot stopped.', mainKeyboard);
}

// --- Telegram Bot Handlers ---
bot.use(session());

bot.start(async (ctx) => {
  await ctx.reply('🤖 Welcome to Bundler Bot!\n\nThis bot detects new tokens on ETH, BSC, and SOL and notifies you with token info and Dex Screener link.', mainKeyboard);
});

bot.hears('🚦 Start Bundler Bot', async (ctx) => {
  await startScanner(ctx);
});

bot.hears('🛑 Stop Bundler Bot', async (ctx) => {
  await stopScanner(ctx);
});

bot.hears('🌐 Select Networks', async (ctx) => {
  await ctx.reply('Please choose a network to scan: 🔷 ETH, 🟡 BSC, 🟣 SOL, or 🔄 ALL.', networkKeyboard);
});

// Map button text to network code
function getNetworkFromButton(text: string): ('ETH' | 'BSC' | 'SOL') | 'ALL' | null {
  switch (text) {
    case '🔷 ETH':
      return 'ETH';
    case '🟡 BSC':
      return 'BSC';
    case '🟣 SOL':
      return 'SOL';
    case '🔄 ALL':
      return 'ALL';
    default:
      return null;
  }
}

bot.hears(['🔷 ETH', '🟡 BSC', '🟣 SOL', '🔄 ALL'], async (ctx) => {
  const userId = ctx.from.id;
  let session = userSessions.get(userId);
  if (!session) {
    session = {
      scanner: null,
      activeNetworks: ['ETH', 'BSC', 'SOL'],
      isScannerRunning: false
    };
    userSessions.set(userId, session);
  }
  const text = ctx.message.text;
  const network = getNetworkFromButton(text);
  if (!network) {
    await ctx.reply('❌ Unknown network selection.', mainKeyboard);
    return;
  }
  if (network === 'ALL') {
    session.activeNetworks = ['ETH', 'BSC', 'SOL'];
  } else {
    session.activeNetworks = [network];
  }
  await ctx.reply(`✅ Networks set to: ${session.activeNetworks.join(', ')}`, mainKeyboard);
  await ctx.reply(`🌐 Network is set to: ${session.activeNetworks.join(', ')}\nYou can now start your bot.`, mainKeyboard);
  if (session.isScannerRunning && session.scanner) {
    await session.scanner.stopScanning();
    await session.scanner.startScanning(session.activeNetworks);
    await ctx.reply('🔄 Scanner restarted with new networks.', mainKeyboard);
  }
});

bot.hears('🔙 Back to Main', async (ctx) => {
  await ctx.reply('🏠 Main Menu', mainKeyboard);
});

// --- Export bot for server.ts ---
export { bot };