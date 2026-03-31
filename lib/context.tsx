'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Trade, DailyNote, WeeklyReview, TradingRule, PsychologyEntry, UserSettings, PerformanceStats, EquityPoint } from './types';
import {
  initializeStore, getTrades, addTrade, updateTrade, deleteTrade,
  getDailyNotes, saveDailyNote, getWeeklyReviews, saveWeeklyReview,
  getTradingRules, saveTradingRules, getPsychologyEntries, savePsychologyEntry,
  getUserSettings, saveUserSettings, computePerformanceStats, getEquityCurve, getDailyStats
} from './store';

interface AppContextType {
  trades: Trade[];
  dailyNotes: DailyNote[];
  weeklyReviews: WeeklyReview[];
  tradingRules: TradingRule[];
  psychologyEntries: PsychologyEntry[];
  settings: UserSettings;
  stats: PerformanceStats;
  equityCurve: EquityPoint[];
  isLoading: boolean;
  refreshTrades: () => void;
  addTrade: (trade: Trade) => void;
  updateTrade: (id: string, updates: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  saveDailyNote: (note: DailyNote) => void;
  saveWeeklyReview: (review: WeeklyReview) => void;
  saveTradingRules: (rules: TradingRule[]) => void;
  savePsychologyEntry: (entry: PsychologyEntry) => void;
  saveSettings: (settings: UserSettings) => void;
  getDailyPnl: (date: string) => number;
  getDailyTradeCount: (date: string) => number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);
  const [psychologyEntries, setPsychologyEntries] = useState<PsychologyEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    userId: 'user-1', displayName: 'Trader', email: '',
    currency: 'USD', theme: 'dark', timezone: 'America/New_York',
    defaultAccountSize: 10000, riskPerTrade: 1,
    notifications: { dailyReminder: true, weeklyReview: true, missedJournaling: false }
  });
  const [stats, setStats] = useState<PerformanceStats>({
    totalPnl: 0, todayPnl: 0, weekPnl: 0, monthPnl: 0,
    winRate: 0, avgWin: 0, avgLoss: 0, riskReward: 0, profitFactor: 0,
    totalTrades: 0, wins: 0, losses: 0, breakevens: 0,
    bestDay: null, worstDay: null, currentStreak: { type: 'win', count: 0 },
    avgHoldTime: 0, maxDrawdown: 0, largestWin: 0, largestLoss: 0
  });
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    const t = getTrades();
    setTrades(t);
    setDailyNotes(getDailyNotes());
    setWeeklyReviews(getWeeklyReviews());
    setTradingRules(getTradingRules());
    setPsychologyEntries(getPsychologyEntries());
    setSettings(getUserSettings());
    setStats(computePerformanceStats(t));
    setEquityCurve(getEquityCurve(t));
  }, []);

  useEffect(() => {
    const CURRENT_VERSION = '2';
    if (localStorage.getItem('tj_version') !== CURRENT_VERSION) {
      ['tj_trades','tj_daily_notes','tj_weekly_reviews','tj_rules','tj_psychology','tj_settings','tj_initialized'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('tj_version', CURRENT_VERSION);
    }
    initializeStore();
    refresh();
    setIsLoading(false);
  }, [refresh]);

  const handleAddTrade = useCallback((trade: Trade) => {
    addTrade(trade);
    refresh();
  }, [refresh]);

  const handleUpdateTrade = useCallback((id: string, updates: Partial<Trade>) => {
    updateTrade(id, updates);
    refresh();
  }, [refresh]);

  const handleDeleteTrade = useCallback((id: string) => {
    deleteTrade(id);
    refresh();
  }, [refresh]);

  const handleSaveDailyNote = useCallback((note: DailyNote) => {
    saveDailyNote(note);
    refresh();
  }, [refresh]);

  const handleSaveWeeklyReview = useCallback((review: WeeklyReview) => {
    saveWeeklyReview(review);
    refresh();
  }, [refresh]);

  const handleSaveTradingRules = useCallback((rules: TradingRule[]) => {
    saveTradingRules(rules);
    refresh();
  }, [refresh]);

  const handleSavePsychologyEntry = useCallback((entry: PsychologyEntry) => {
    savePsychologyEntry(entry);
    refresh();
  }, [refresh]);

  const handleSaveSettings = useCallback((s: UserSettings) => {
    saveUserSettings(s);
    setSettings(s);
  }, []);

  const getDailyPnl = useCallback((date: string) => {
    return trades.filter(t => t.date === date).reduce((sum, t) => sum + t.pnl - (t.fees || 0), 0);
  }, [trades]);

  const getDailyTradeCount = useCallback((date: string) => {
    return trades.filter(t => t.date === date).length;
  }, [trades]);

  return (
    <AppContext.Provider value={{
      trades, dailyNotes, weeklyReviews, tradingRules, psychologyEntries,
      settings, stats, equityCurve, isLoading,
      refreshTrades: refresh,
      addTrade: handleAddTrade, updateTrade: handleUpdateTrade, deleteTrade: handleDeleteTrade,
      saveDailyNote: handleSaveDailyNote, saveWeeklyReview: handleSaveWeeklyReview,
      saveTradingRules: handleSaveTradingRules, savePsychologyEntry: handleSavePsychologyEntry,
      saveSettings: handleSaveSettings, getDailyPnl, getDailyTradeCount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
