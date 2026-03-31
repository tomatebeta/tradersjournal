'use client';

import { Trade, DailyNote, WeeklyReview, TradingRule, PsychologyEntry, UserSettings, PerformanceStats, DailyStats, EquityPoint } from './types';
import { generateEquityCurve } from './mock-data';
import { startOfWeek, startOfMonth, format } from 'date-fns';

const STORAGE_KEYS = {
  trades: 'tj_trades',
  dailyNotes: 'tj_daily_notes',
  weeklyReviews: 'tj_weekly_reviews',
  rules: 'tj_rules',
  psychology: 'tj_psychology',
  settings: 'tj_settings',
  initialized: 'tj_initialized',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const DEFAULT_SETTINGS: UserSettings = {
  userId: 'user-1',
  displayName: 'Trader',
  email: '',
  currency: 'USD',
  theme: 'dark',
  timezone: 'America/New_York',
  defaultAccountSize: 10000,
  riskPerTrade: 1,
  notifications: { dailyReminder: true, weeklyReview: true, missedJournaling: false },
};

export function initializeStore() {
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (!initialized) {
    safeSet(STORAGE_KEYS.trades, []);
    safeSet(STORAGE_KEYS.dailyNotes, []);
    safeSet(STORAGE_KEYS.weeklyReviews, []);
    safeSet(STORAGE_KEYS.rules, []);
    safeSet(STORAGE_KEYS.psychology, []);
    safeSet(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');
  }
}

export function getTrades(): Trade[] {
  return safeGet<Trade[]>(STORAGE_KEYS.trades, []);
}

export function saveTrades(trades: Trade[]) {
  safeSet(STORAGE_KEYS.trades, trades);
}

export function addTrade(trade: Trade) {
  const trades = getTrades();
  trades.unshift(trade);
  saveTrades(trades);
}

export function updateTrade(id: string, updates: Partial<Trade>) {
  const trades = getTrades();
  const idx = trades.findIndex(t => t.id === id);
  if (idx !== -1) {
    trades[idx] = { ...trades[idx], ...updates, updatedAt: new Date().toISOString() };
    saveTrades(trades);
  }
}

export function deleteTrade(id: string) {
  const trades = getTrades().filter(t => t.id !== id);
  saveTrades(trades);
}

export function getDailyNotes(): DailyNote[] {
  return safeGet<DailyNote[]>(STORAGE_KEYS.dailyNotes, []);
}

export function saveDailyNote(note: DailyNote) {
  const notes = getDailyNotes();
  const idx = notes.findIndex(n => n.date === note.date);
  if (idx !== -1) notes[idx] = note;
  else notes.unshift(note);
  safeSet(STORAGE_KEYS.dailyNotes, notes);
}

export function getWeeklyReviews(): WeeklyReview[] {
  return safeGet<WeeklyReview[]>(STORAGE_KEYS.weeklyReviews, []);
}

export function saveWeeklyReview(review: WeeklyReview) {
  const reviews = getWeeklyReviews();
  const idx = reviews.findIndex(r => r.id === review.id);
  if (idx !== -1) reviews[idx] = review;
  else reviews.unshift(review);
  safeSet(STORAGE_KEYS.weeklyReviews, reviews);
}

export function getTradingRules(): TradingRule[] {
  return safeGet<TradingRule[]>(STORAGE_KEYS.rules, []);
}

export function saveTradingRules(rules: TradingRule[]) {
  safeSet(STORAGE_KEYS.rules, rules);
}

export function getPsychologyEntries(): PsychologyEntry[] {
  return safeGet<PsychologyEntry[]>(STORAGE_KEYS.psychology, []);
}

export function savePsychologyEntry(entry: PsychologyEntry) {
  const entries = getPsychologyEntries();
  const idx = entries.findIndex(e => e.id === entry.id);
  if (idx !== -1) entries[idx] = entry;
  else entries.unshift(entry);
  safeSet(STORAGE_KEYS.psychology, entries);
}

export function getUserSettings(): UserSettings {
  return safeGet<UserSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveUserSettings(settings: UserSettings) {
  safeSet(STORAGE_KEYS.settings, settings);
}

export function getTradesByDate(date: string): Trade[] {
  return getTrades().filter(t => t.date === date);
}

export function getTradesByDateRange(start: string, end: string): Trade[] {
  return getTrades().filter(t => t.date >= start && t.date <= end);
}

export function getDailyStats(trades: Trade[]): Map<string, DailyStats> {
  const map = new Map<string, DailyStats>();
  trades.forEach(trade => {
    const existing = map.get(trade.date) || { date: trade.date, pnl: 0, trades: 0, wins: 0, losses: 0, winRate: 0 };
    existing.pnl += trade.pnl - (trade.fees || 0);
    existing.trades += 1;
    if (trade.outcome === 'win') existing.wins += 1;
    else if (trade.outcome === 'loss') existing.losses += 1;
    map.set(trade.date, existing);
  });
  map.forEach(stats => {
    stats.pnl = parseFloat(stats.pnl.toFixed(2));
    stats.winRate = stats.trades > 0 ? parseFloat(((stats.wins / stats.trades) * 100).toFixed(1)) : 0;
  });
  return map;
}

export function computePerformanceStats(trades: Trade[]): PerformanceStats {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const wins = trades.filter(t => t.outcome === 'win');
  const losses = trades.filter(t => t.outcome === 'loss');
  const breakevens = trades.filter(t => t.outcome === 'breakeven');

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl - (t.fees || 0), 0);
  const todayPnl = trades.filter(t => t.date === today).reduce((sum, t) => sum + t.pnl - (t.fees || 0), 0);
  const weekPnl = trades.filter(t => t.date >= weekStart).reduce((sum, t) => sum + t.pnl - (t.fees || 0), 0);
  const monthPnl = trades.filter(t => t.date >= monthStart).reduce((sum, t) => sum + t.pnl - (t.fees || 0), 0);

  const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length) : 0;
  const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const dailyStats = getDailyStats(trades);
  const dailyArr = Array.from(dailyStats.values());
  const bestDay = dailyArr.length > 0 ? dailyArr.reduce((best, d) => d.pnl > best.pnl ? d : best) : null;
  const worstDay = dailyArr.length > 0 ? dailyArr.reduce((worst, d) => d.pnl < worst.pnl ? d : worst) : null;

  const sortedTrades = [...trades].sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());
  let streakCount = 0;
  let streakType: 'win' | 'loss' = 'win';
  if (sortedTrades.length > 0) {
    streakType = sortedTrades[0].outcome === 'win' ? 'win' : 'loss';
    for (const t of sortedTrades) {
      if (t.outcome === 'breakeven') continue;
      if ((streakType === 'win' && t.outcome === 'win') || (streakType === 'loss' && t.outcome === 'loss')) {
        streakCount++;
      } else break;
    }
  }

  const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0;

  return {
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    todayPnl: parseFloat(todayPnl.toFixed(2)),
    weekPnl: parseFloat(weekPnl.toFixed(2)),
    monthPnl: parseFloat(monthPnl.toFixed(2)),
    winRate: trades.length > 0 ? parseFloat(((wins.length / (wins.length + losses.length)) * 100).toFixed(1)) : 0,
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    riskReward: parseFloat(riskReward.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    bestDay,
    worstDay,
    currentStreak: { type: streakType, count: streakCount },
    avgHoldTime: 0,
    maxDrawdown: 0,
    largestWin: parseFloat(largestWin.toFixed(2)),
    largestLoss: parseFloat(largestLoss.toFixed(2)),
  };
}

export function getEquityCurve(trades: Trade[]): EquityPoint[] {
  return generateEquityCurve(trades);
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}
