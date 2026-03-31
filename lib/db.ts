import { createClient } from '@/lib/supabase/client';
import {
  Trade, WeeklyReview, PsychologyEntry, TradingRule, UserSettings,
  PerformanceStats, EquityPoint, DailyNote
} from './types';
import { computePerformanceStats, getEquityCurve } from './store';

const db = () => createClient();

// ─── helpers ─────────────────────────────────────────────────────────────────

function rowToTrade(r: Record<string, unknown>): Trade {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    date: (r.date as string).slice(0, 10),
    time: (r.time as string).slice(0, 5),
    symbol: r.symbol as string,
    assetType: r.asset_type as Trade['assetType'],
    direction: r.direction as Trade['direction'],
    entryPrice: Number(r.entry_price),
    exitPrice: Number(r.exit_price),
    stopLoss: r.stop_loss != null ? Number(r.stop_loss) : undefined,
    takeProfit: r.take_profit != null ? Number(r.take_profit) : undefined,
    positionSize: Number(r.position_size),
    pnl: Number(r.pnl),
    fees: r.fees != null ? Number(r.fees) : undefined,
    riskAmount: r.risk_amount != null ? Number(r.risk_amount) : undefined,
    rMultiple: r.r_multiple != null ? Number(r.r_multiple) : undefined,
    outcome: r.outcome as Trade['outcome'],
    strategy: r.strategy as string | undefined,
    setup: r.setup as string | undefined,
    timeframe: r.timeframe as Trade['timeframe'],
    session: r.session as Trade['session'],
    notes: r.notes as string | undefined,
    lessonsLearned: r.lessons_learned as string | undefined,
    tags: (r.tags as string[]) || [],
    mistakes: (r.mistakes as string[]) || [],
    emotionBefore: r.emotion_before as Trade['emotionBefore'],
    emotionAfter: r.emotion_after as Trade['emotionAfter'],
    confidenceRating: r.confidence_rating != null ? Number(r.confidence_rating) : undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function tradeToRow(t: Trade) {
  return {
    id: t.id,
    user_id: t.userId,
    date: t.date,
    time: t.time,
    symbol: t.symbol,
    asset_type: t.assetType,
    direction: t.direction,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    stop_loss: t.stopLoss ?? null,
    take_profit: t.takeProfit ?? null,
    position_size: t.positionSize,
    pnl: t.pnl,
    fees: t.fees ?? 0,
    risk_amount: t.riskAmount ?? null,
    r_multiple: t.rMultiple ?? null,
    outcome: t.outcome,
    strategy: t.strategy ?? null,
    setup: t.setup ?? null,
    timeframe: t.timeframe ?? null,
    session: t.session ?? null,
    notes: t.notes ?? null,
    lessons_learned: t.lessonsLearned ?? null,
    tags: t.tags ?? [],
    mistakes: t.mistakes ?? [],
    emotion_before: t.emotionBefore ?? null,
    emotion_after: t.emotionAfter ?? null,
    confidence_rating: t.confidenceRating ?? null,
    updated_at: new Date().toISOString(),
  };
}

function rowToWeeklyReview(r: Record<string, unknown>): WeeklyReview {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    weekStart: (r.week_start as string).slice(0, 10),
    weekEnd: (r.week_end as string).slice(0, 10),
    totalPnl: Number(r.total_pnl),
    tradeCount: Number(r.trade_count),
    winRate: Number(r.win_rate),
    wentWell: r.went_well as string | undefined,
    wentWrong: r.went_wrong as string | undefined,
    mostCommonMistake: r.most_common_mistake as string | undefined,
    bestSetup: r.best_setup as string | undefined,
    goalForNextWeek: r.goal_for_next_week as string | undefined,
    psychologicalNotes: r.psychological_notes as string | undefined,
    disciplineScore: r.discipline_score != null ? Number(r.discipline_score) : undefined,
    createdAt: r.created_at as string,
  };
}

function rowToPsychology(r: Record<string, unknown>): PsychologyEntry {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    date: (r.date as string).slice(0, 10),
    type: r.type as PsychologyEntry['type'],
    title: r.title as string,
    content: r.content as string,
    mood: r.mood as PsychologyEntry['mood'],
    confidenceLevel: r.confidence_level != null ? Number(r.confidence_level) : undefined,
    createdAt: r.created_at as string,
  };
}

function rowToRule(r: Record<string, unknown>): TradingRule {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    type: r.type as TradingRule['type'],
    title: r.title as string,
    description: r.description as string | undefined,
    value: r.value != null ? Number(r.value) : undefined,
    active: r.active as boolean,
  };
}

function rowToSettings(r: Record<string, unknown>, userId: string): UserSettings {
  const notif = (r.notifications as { dailyReminder?: boolean; weeklyReview?: boolean; missedJournaling?: boolean }) || {};
  return {
    userId,
    displayName: (r.display_name as string) || 'Trader',
    email: '',
    currency: (r.currency as string) || 'USD',
    theme: (r.theme as UserSettings['theme']) || 'dark',
    timezone: (r.timezone as string) || 'America/New_York',
    defaultAccountSize: Number(r.default_account_size) || 10000,
    riskPerTrade: Number(r.risk_per_trade) || 1,
    notifications: {
      dailyReminder: notif.dailyReminder ?? true,
      weeklyReview: notif.weeklyReview ?? true,
      missedJournaling: notif.missedJournaling ?? false,
    },
  };
}

// ─── TRADES ──────────────────────────────────────────────────────────────────

export async function dbGetTrades(userId: string): Promise<Trade[]> {
  const { data, error } = await db()
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) { console.error('dbGetTrades', error); return []; }
  return (data || []).map(r => rowToTrade(r as Record<string, unknown>));
}

export async function dbAddTrade(trade: Trade): Promise<void> {
  const { error } = await db().from('trades').insert(tradeToRow(trade));
  if (error) throw new Error(error.message);
}

export async function dbUpdateTrade(id: string, updates: Partial<Trade>): Promise<void> {
  const partial: Record<string, unknown> = {};
  if (updates.date !== undefined) partial.date = updates.date;
  if (updates.time !== undefined) partial.time = updates.time;
  if (updates.symbol !== undefined) partial.symbol = updates.symbol;
  if (updates.assetType !== undefined) partial.asset_type = updates.assetType;
  if (updates.direction !== undefined) partial.direction = updates.direction;
  if (updates.entryPrice !== undefined) partial.entry_price = updates.entryPrice;
  if (updates.exitPrice !== undefined) partial.exit_price = updates.exitPrice;
  if (updates.stopLoss !== undefined) partial.stop_loss = updates.stopLoss;
  if (updates.takeProfit !== undefined) partial.take_profit = updates.takeProfit;
  if (updates.positionSize !== undefined) partial.position_size = updates.positionSize;
  if (updates.pnl !== undefined) partial.pnl = updates.pnl;
  if (updates.fees !== undefined) partial.fees = updates.fees;
  if (updates.riskAmount !== undefined) partial.risk_amount = updates.riskAmount;
  if (updates.rMultiple !== undefined) partial.r_multiple = updates.rMultiple;
  if (updates.outcome !== undefined) partial.outcome = updates.outcome;
  if (updates.strategy !== undefined) partial.strategy = updates.strategy;
  if (updates.setup !== undefined) partial.setup = updates.setup;
  if (updates.timeframe !== undefined) partial.timeframe = updates.timeframe;
  if (updates.session !== undefined) partial.session = updates.session;
  if (updates.notes !== undefined) partial.notes = updates.notes;
  if (updates.lessonsLearned !== undefined) partial.lessons_learned = updates.lessonsLearned;
  if (updates.tags !== undefined) partial.tags = updates.tags;
  if (updates.mistakes !== undefined) partial.mistakes = updates.mistakes;
  if (updates.emotionBefore !== undefined) partial.emotion_before = updates.emotionBefore;
  if (updates.emotionAfter !== undefined) partial.emotion_after = updates.emotionAfter;
  if (updates.confidenceRating !== undefined) partial.confidence_rating = updates.confidenceRating;
  partial.updated_at = new Date().toISOString();
  const { error } = await db().from('trades').update(partial).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbDeleteTrade(id: string): Promise<void> {
  const { error } = await db().from('trades').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── WEEKLY REVIEWS ──────────────────────────────────────────────────────────

export async function dbGetWeeklyReviews(userId: string): Promise<WeeklyReview[]> {
  const { data, error } = await db()
    .from('weekly_reviews')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false });
  if (error) { console.error('dbGetWeeklyReviews', error); return []; }
  return (data || []).map(r => rowToWeeklyReview(r as Record<string, unknown>));
}

export async function dbSaveWeeklyReview(review: WeeklyReview): Promise<void> {
  const row = {
    id: review.id,
    user_id: review.userId,
    week_start: review.weekStart,
    week_end: review.weekEnd,
    total_pnl: review.totalPnl,
    trade_count: review.tradeCount,
    win_rate: review.winRate,
    went_well: review.wentWell ?? null,
    went_wrong: review.wentWrong ?? null,
    most_common_mistake: review.mostCommonMistake ?? null,
    best_setup: review.bestSetup ?? null,
    goal_for_next_week: review.goalForNextWeek ?? null,
    psychological_notes: review.psychologicalNotes ?? null,
    discipline_score: review.disciplineScore ?? null,
  };
  const { error } = await db().from('weekly_reviews').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

// ─── PSYCHOLOGY ───────────────────────────────────────────────────────────────

export async function dbGetPsychologyEntries(userId: string): Promise<PsychologyEntry[]> {
  const { data, error } = await db()
    .from('psychology_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) { console.error('dbGetPsychologyEntries', error); return []; }
  return (data || []).map(r => rowToPsychology(r as Record<string, unknown>));
}

export async function dbSavePsychologyEntry(entry: PsychologyEntry): Promise<void> {
  const row = {
    id: entry.id,
    user_id: entry.userId,
    date: entry.date,
    type: entry.type,
    title: entry.title,
    content: entry.content,
    mood: entry.mood ?? 5,
    confidence_level: entry.confidenceLevel ?? 5,
  };
  const { error } = await db().from('psychology_entries').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function dbDeletePsychologyEntry(id: string): Promise<void> {
  const { error } = await db().from('psychology_entries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── TRADING RULES ────────────────────────────────────────────────────────────

export async function dbGetTradingRules(userId: string): Promise<TradingRule[]> {
  const { data, error } = await db()
    .from('trading_rules')
    .select('*')
    .eq('user_id', userId);
  if (error) { console.error('dbGetTradingRules', error); return []; }
  return (data || []).map(r => rowToRule(r as Record<string, unknown>));
}

export async function dbSaveTradingRules(userId: string, rules: TradingRule[]): Promise<void> {
  const { error: delErr } = await db().from('trading_rules').delete().eq('user_id', userId);
  if (delErr) throw new Error(delErr.message);
  if (rules.length === 0) return;
  const rows = rules.map(r => ({
    id: r.id,
    user_id: userId,
    type: r.type,
    title: r.title,
    description: r.description ?? null,
    value: r.value ?? null,
    active: r.active,
  }));
  const { error } = await db().from('trading_rules').insert(rows);
  if (error) throw new Error(error.message);
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export async function dbGetSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await db()
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) { return null; }
  return rowToSettings(data as Record<string, unknown>, userId);
}

export async function dbSaveSettings(settings: UserSettings): Promise<void> {
  const row = {
    user_id: settings.userId,
    display_name: settings.displayName,
    currency: settings.currency,
    theme: settings.theme,
    timezone: settings.timezone,
    default_account_size: settings.defaultAccountSize,
    risk_per_trade: settings.riskPerTrade,
    notifications: settings.notifications,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db()
    .from('user_settings')
    .upsert(row, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

// ─── DAILY NOTES ─────────────────────────────────────────────────────────────

export async function dbGetDailyNotes(userId: string): Promise<DailyNote[]> {
  return [];
}

// ─── COMPUTED ────────────────────────────────────────────────────────────────

export { computePerformanceStats, getEquityCurve };
