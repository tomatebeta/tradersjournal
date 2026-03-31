import { Trade, DailyNote, WeeklyReview, TradingRule, PsychologyEntry, UserSettings, EquityPoint } from './types';
import { subDays, format, addDays } from 'date-fns';

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export const DEMO_USER: UserSettings = {
  userId: 'demo-user-1',
  displayName: 'Alex Morgan',
  email: 'alex@tradejournal.pro',
  currency: 'USD',
  theme: 'dark',
  timezone: 'America/New_York',
  defaultAccountSize: 50000,
  riskPerTrade: 1,
  notifications: { dailyReminder: true, weeklyReview: true, missedJournaling: true },
};

const strategies = ['Breakout', 'Pullback', 'Reversal', 'Trend Follow', 'FVG Fill', 'VWAP Reclaim', 'Order Block', 'Supply/Demand', 'ICT Concept', 'Scalp'];
const symbols = ['ES', 'NQ', 'SPY', 'QQQ', 'AAPL', 'TSLA', 'MSFT', 'NVDA', 'BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'GC', 'CL'];
const sessions: Trade['session'][] = ['london', 'new_york', 'asia', 'london_ny_overlap', 'pre_market'];
const timeframes: Trade['timeframe'][] = ['1m', '5m', '15m', '30m', '1h', '4h', 'D'];
const tagPool = ['FVG', 'breakout', 'pullback', 'trend', 'reversal', 'scalping', 'swing', 'momentum', 'mean-reversion', 'gap-fill', 'vwap', 'support', 'resistance', 'order-block'];
const emotions: Trade['emotionBefore'][] = ['calm', 'confident', 'anxious', 'focused', 'neutral', 'overconfident'];
const mistakePool = ['Sized too big', 'Moved stop too early', 'Chased entry', 'No clear setup', 'Ignored news', 'Exited too early', 'Added to loser', 'Revenge traded', 'Over-traded', 'FOMO entry'];

function randBetween(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(randBetween(min, max + 1)); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

let tradeIdCounter = 1;

function generateTrade(date: string, pnlBias: number = 0): Trade {
  const direction: Trade['direction'] = Math.random() > 0.5 ? 'long' : 'short';
  const symbol = pick(symbols);
  const entryPrice = parseFloat(randBetween(100, 5000).toFixed(2));
  const isWin = Math.random() < (0.58 + pnlBias);
  const pnl = isWin ? parseFloat(randBetween(150, 2800).toFixed(2)) : -parseFloat(randBetween(80, 1200).toFixed(2));
  const outcome: Trade['outcome'] = Math.abs(pnl) < 20 ? 'breakeven' : pnl > 0 ? 'win' : 'loss';
  const rMultiple = parseFloat((pnl / randBetween(200, 500)).toFixed(2));
  const fees = parseFloat(randBetween(2, 12).toFixed(2));
  const strategy = pick(strategies);

  const hours = randInt(8, 15);
  const mins = randInt(0, 59);
  const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

  return {
    id: `trade-${tradeIdCounter++}`,
    userId: 'demo-user-1',
    date,
    time: timeStr,
    symbol,
    assetType: symbol.includes('/') ? (symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('ETH') ? 'forex' : 'crypto') : ['GC', 'CL'].includes(symbol) ? 'futures' : ['ES', 'NQ'].includes(symbol) ? 'futures' : 'stocks',
    direction,
    entryPrice,
    exitPrice: parseFloat((entryPrice + (direction === 'long' ? 1 : -1) * randBetween(0.5, 20)).toFixed(2)),
    stopLoss: parseFloat((entryPrice + (direction === 'long' ? -1 : 1) * randBetween(1, 15)).toFixed(2)),
    takeProfit: parseFloat((entryPrice + (direction === 'long' ? 1 : -1) * randBetween(5, 40)).toFixed(2)),
    positionSize: randInt(1, 50),
    riskAmount: parseFloat(randBetween(200, 600).toFixed(2)),
    pnl,
    rMultiple,
    fees,
    strategy,
    setup: strategy,
    timeframe: pick(timeframes),
    session: pick(sessions),
    confidenceRating: randInt(5, 10),
    emotionBefore: pick(emotions),
    emotionAfter: pnl > 0 ? pick(['calm', 'confident', 'focused'] as Trade['emotionBefore'][]) : pick(['frustrated', 'anxious', 'neutral'] as Trade['emotionBefore'][]),
    mistakes: pnl < 0 ? pickN(mistakePool, randInt(0, 2)) : pickN(mistakePool, randInt(0, 1)),
    lessonsLearned: pnl < 0 ? 'Wait for better confirmation before entering.' : 'Stick to the plan and let winners run.',
    notes: `${strategy} trade on ${symbol}. ${direction === 'long' ? 'Bullish' : 'Bearish'} bias confirmed by ${pick(['price action', 'volume', 'momentum', 'trend structure', 'key level'])}.`,
    tags: pickN(tagPool, randInt(2, 4)),
    images: [],
    outcome,
    createdAt: new Date(date).toISOString(),
    updatedAt: new Date(date).toISOString(),
  };
}

function generateDayTrades(date: string, count: number, pnlBias: number = 0): Trade[] {
  return Array.from({ length: count }, () => generateTrade(date, pnlBias));
}

export function generateMockTrades(): Trade[] {
  const trades: Trade[] = [];
  const weekdays = [1, 2, 3, 4, 5];

  for (let i = 90; i >= 0; i--) {
    const d = subDays(today, i);
    const dow = d.getDay();
    if (!weekdays.includes(dow)) continue;

    const tradingDay = Math.random() < 0.78;
    if (!tradingDay) continue;

    const tradeCount = randInt(1, 5);
    const bias = Math.random() * 0.2 - 0.05;
    trades.push(...generateDayTrades(fmt(d), tradeCount, bias));
  }

  return trades;
}

export function generateEquityCurve(trades: Trade[]): EquityPoint[] {
  const startingEquity = 50000;
  const byDate = new Map<string, number>();

  trades.forEach(t => {
    const prev = byDate.get(t.date) || 0;
    byDate.set(t.date, prev + t.pnl - (t.fees || 0));
  });

  const dates = Array.from(byDate.keys()).sort();
  let equity = startingEquity;
  let peak = startingEquity;
  const curve: EquityPoint[] = [];

  dates.forEach(date => {
    const pnl = byDate.get(date) || 0;
    equity += pnl;
    if (equity > peak) peak = equity;
    const drawdown = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    curve.push({ date, equity: parseFloat(equity.toFixed(2)), pnl: parseFloat(pnl.toFixed(2)), drawdown: parseFloat(drawdown.toFixed(2)) });
  });

  return curve;
}

export const MOCK_TRADING_RULES: TradingRule[] = [
  { id: 'rule-1', userId: 'demo-user-1', type: 'daily_loss_limit', title: 'Daily Loss Limit', description: 'Stop trading if daily loss exceeds this amount', value: 500, active: true },
  { id: 'rule-2', userId: 'demo-user-1', type: 'weekly_loss_limit', title: 'Weekly Loss Limit', description: 'No more trading this week if exceeded', value: 1500, active: true },
  { id: 'rule-3', userId: 'demo-user-1', type: 'max_trades_per_day', title: 'Max Trades Per Day', description: 'Maximum number of trades allowed per session', value: 5, active: true },
  { id: 'rule-4', userId: 'demo-user-1', type: 'risk', title: 'Max Risk Per Trade', description: 'Never risk more than 1% of account per trade', value: 1, active: true },
  { id: 'rule-5', userId: 'demo-user-1', type: 'checklist', title: 'Pre-Trade Checklist', description: 'Always check HTF bias, news calendar, and key levels before entering', active: true },
  { id: 'rule-6', userId: 'demo-user-1', type: 'custom', title: 'No Revenge Trading', description: 'After 2 consecutive losses, step away for 30 minutes', active: true },
  { id: 'rule-7', userId: 'demo-user-1', type: 'custom', title: 'Follow Your System', description: 'Only trade setups that match your defined criteria — no exceptions', active: true },
];

export const MOCK_DAILY_NOTES: DailyNote[] = [
  { id: 'dn-1', userId: 'demo-user-1', date: fmt(subDays(today, 1)), preMarketNote: 'CPI data today at 8:30 AM. Expecting volatility. Will wait for the dust to settle before entering.', postMarketNote: 'Good session. Stayed patient and only took 2 high-quality setups.', mood: 'focused', disciplineScore: 9 },
  { id: 'dn-2', userId: 'demo-user-1', date: fmt(subDays(today, 2)), preMarketNote: 'Range-bound market expected. Looking for FVG fills.', postMarketNote: 'Overtraded. Should have stopped after 3rd trade.', mood: 'frustrated', disciplineScore: 6 },
  { id: 'dn-3', userId: 'demo-user-1', date: fmt(subDays(today, 3)), preMarketNote: 'Strong bullish momentum from yesterday. Looking to buy pullbacks.', postMarketNote: 'Great day. Two perfect setups executed cleanly.', mood: 'confident', disciplineScore: 10 },
  { id: 'dn-4', userId: 'demo-user-1', date: fmt(today), preMarketNote: 'Fed minutes today. Staying cautious with position sizes.', mood: 'calm' },
];

export const MOCK_WEEKLY_REVIEWS: WeeklyReview[] = [
  {
    id: 'wr-1', userId: 'demo-user-1',
    weekStart: fmt(subDays(today, 7)), weekEnd: fmt(subDays(today, 3)),
    totalPnl: 2340, tradeCount: 18, winRate: 61,
    wentWell: 'Excellent execution on breakout setups. Stayed disciplined with risk management.',
    wentWrong: 'Overtraded on Wednesday — took 3 setups below my quality threshold.',
    mostCommonMistake: 'Exiting winners too early',
    bestSetup: 'FVG Fill on NQ during NY open',
    goalForNextWeek: 'Minimum 7/10 confidence before entering. Max 4 trades per day.',
    psychologicalNotes: 'Felt FOMO pressure mid-week. Need to work on detachment from outcome.',
    disciplineScore: 8, createdAt: new Date().toISOString()
  }
];

export const MOCK_PSYCHOLOGY: PsychologyEntry[] = [
  { id: 'psy-1', userId: 'demo-user-1', date: fmt(subDays(today, 1)), type: 'post_market', title: 'Staying patient in choppy markets', content: 'Today reinforced the importance of patience. I missed two A+ setups because I was already in mediocre trades. Quality over quantity is the real edge.', mood: 'calm', confidenceLevel: 8, createdAt: new Date().toISOString() },
  { id: 'psy-2', userId: 'demo-user-1', date: fmt(subDays(today, 3)), type: 'reflection', title: 'Why I revenge traded last Friday', content: 'I gave back $600 in the last hour because I got frustrated after a stop-out. The market does not owe me anything. My job is to execute the system, not to recover losses.', mood: 'frustrated', confidenceLevel: 5, createdAt: new Date().toISOString() },
  { id: 'psy-3', userId: 'demo-user-1', date: fmt(subDays(today, 5)), type: 'mindset', title: 'The process matters more than the outcome', content: 'I had three losses in a row today but each trade was correctly executed according to my plan. The losses were valid — the market simply moved against me. I feel good about the process.', mood: 'focused', confidenceLevel: 9, createdAt: new Date().toISOString() },
  { id: 'psy-4', userId: 'demo-user-1', date: fmt(subDays(today, 8)), type: 'pre_market', title: 'Setting intentions for the week', content: 'This week I will focus on: 1) Only A+ setups, 2) Hard stop at daily loss limit, 3) Review each trade before end of session. Profit is secondary to process.', mood: 'confident', confidenceLevel: 8, createdAt: new Date().toISOString() },
];
