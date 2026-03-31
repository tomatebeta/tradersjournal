export type AssetType = 'stocks' | 'futures' | 'forex' | 'crypto' | 'options' | 'indices' | 'commodities';
export type Direction = 'long' | 'short';
export type Outcome = 'win' | 'loss' | 'breakeven';
export type Session = 'london' | 'new_york' | 'asia' | 'london_ny_overlap' | 'pre_market' | 'after_hours' | 'custom';
export type Timeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '8h' | 'D' | 'W';
export type EmotionType = 'calm' | 'confident' | 'anxious' | 'fearful' | 'greedy' | 'frustrated' | 'focused' | 'overconfident' | 'revenge' | 'neutral';

export interface Trade {
  id: string;
  userId: string;
  date: string;
  time: string;
  symbol: string;
  assetType: AssetType;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize: number;
  riskAmount?: number;
  leverage?: number;
  tickValue?: number;
  pnl: number;
  rMultiple?: number;
  fees?: number;
  strategy?: string;
  setup?: string;
  timeframe?: Timeframe;
  session?: Session;
  confidenceRating?: number;
  emotionBefore?: EmotionType;
  emotionAfter?: EmotionType;
  mistakes?: string[];
  lessonsLearned?: string;
  notes?: string;
  tags?: string[];
  images?: TradeImage[];
  outcome: Outcome;
  createdAt: string;
  updatedAt: string;
}

export interface TradeImage {
  id: string;
  tradeId: string;
  url: string;
  type: 'before' | 'after' | 'other';
  caption?: string;
}

export interface DailyNote {
  id: string;
  userId: string;
  date: string;
  preMarketNote?: string;
  postMarketNote?: string;
  mood?: EmotionType;
  disciplineScore?: number;
  totalPnl?: number;
  tradeCount?: number;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  totalPnl: number;
  tradeCount: number;
  winRate: number;
  wentWell?: string;
  wentWrong?: string;
  mostCommonMistake?: string;
  bestSetup?: string;
  goalForNextWeek?: string;
  psychologicalNotes?: string;
  disciplineScore?: number;
  createdAt: string;
}

export interface MonthlyReview {
  id: string;
  userId: string;
  month: string;
  year: number;
  totalPnl: number;
  tradeCount: number;
  winRate: number;
  wentWell?: string;
  wentWrong?: string;
  bestSetup?: string;
  goalForNextMonth?: string;
  psychologicalNotes?: string;
  disciplineScore?: number;
  createdAt: string;
}

export interface TradingRule {
  id: string;
  userId: string;
  type: 'daily_loss_limit' | 'weekly_loss_limit' | 'max_trades_per_day' | 'custom' | 'risk' | 'checklist';
  title: string;
  description?: string;
  value?: number;
  active: boolean;
}

export interface PsychologyEntry {
  id: string;
  userId: string;
  date: string;
  type: 'mindset' | 'emotional' | 'confidence' | 'pre_market' | 'post_market' | 'reflection';
  title: string;
  content: string;
  mood?: EmotionType;
  confidenceLevel?: number;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  displayName: string;
  email: string;
  avatar?: string;
  currency: string;
  theme: 'dark' | 'light' | 'system';
  timezone: string;
  defaultAccountSize: number;
  riskPerTrade: number;
  notifications: {
    dailyReminder: boolean;
    weeklyReview: boolean;
    missedJournaling: boolean;
  };
}

export interface DailyStats {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  pnl: number;
  drawdown: number;
}

export interface PerformanceStats {
  totalPnl: number;
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  riskReward: number;
  profitFactor: number;
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  bestDay: DailyStats | null;
  worstDay: DailyStats | null;
  currentStreak: { type: 'win' | 'loss'; count: number };
  avgHoldTime: number;
  maxDrawdown: number;
  largestWin: number;
  largestLoss: number;
}
