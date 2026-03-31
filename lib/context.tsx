'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { Trade, DailyNote, WeeklyReview, TradingRule, PsychologyEntry, UserSettings, PerformanceStats, EquityPoint } from './types';
import { computePerformanceStats, getEquityCurve } from './store';
import { createClient } from './supabase/client';
import {
  dbGetTrades, dbAddTrade, dbUpdateTrade, dbDeleteTrade,
  dbGetWeeklyReviews, dbSaveWeeklyReview,
  dbGetPsychologyEntries, dbSavePsychologyEntry,
  dbGetTradingRules, dbSaveTradingRules,
  dbGetSettings, dbSaveSettings,
} from './db';

const DEFAULT_SETTINGS = (userId: string, email: string, displayName: string): UserSettings => ({
  userId, displayName, email,
  currency: 'USD', theme: 'dark', timezone: 'America/New_York',
  defaultAccountSize: 10000, riskPerTrade: 1,
  notifications: { dailyReminder: true, weeklyReview: true, missedJournaling: false },
});

interface AppContextType {
  user: User | null;
  trades: Trade[];
  dailyNotes: DailyNote[];
  weeklyReviews: WeeklyReview[];
  tradingRules: TradingRule[];
  psychologyEntries: PsychologyEntry[];
  settings: UserSettings;
  stats: PerformanceStats;
  equityCurve: EquityPoint[];
  isLoading: boolean;
  refreshTrades: () => Promise<void>;
  addTrade: (trade: Trade) => Promise<void>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  saveDailyNote: (note: DailyNote) => void;
  saveWeeklyReview: (review: WeeklyReview) => Promise<void>;
  saveTradingRules: (rules: TradingRule[]) => Promise<void>;
  savePsychologyEntry: (entry: PsychologyEntry) => Promise<void>;
  saveSettings: (settings: UserSettings) => Promise<void>;
  getDailyPnl: (date: string) => number;
  getDailyTradeCount: (date: string) => number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [dailyNotes] = useState<DailyNote[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);
  const [psychologyEntries, setPsychologyEntries] = useState<PsychologyEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS('', '', 'Trader'));
  const [stats, setStats] = useState<PerformanceStats>({
    totalPnl: 0, todayPnl: 0, weekPnl: 0, monthPnl: 0,
    winRate: 0, avgWin: 0, avgLoss: 0, riskReward: 0, profitFactor: 0,
    totalTrades: 0, wins: 0, losses: 0, breakevens: 0,
    bestDay: null, worstDay: null, currentStreak: { type: 'win', count: 0 },
    avgHoldTime: 0, maxDrawdown: 0, largestWin: 0, largestLoss: 0,
  });
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async (userId: string, email: string, displayName: string) => {
    const [t, wr, pe, tr, s] = await Promise.all([
      dbGetTrades(userId),
      dbGetWeeklyReviews(userId),
      dbGetPsychologyEntries(userId),
      dbGetTradingRules(userId),
      dbGetSettings(userId),
    ]);
    setTrades(t);
    setWeeklyReviews(wr);
    setPsychologyEntries(pe);
    setTradingRules(tr);
    const resolvedSettings = s ?? DEFAULT_SETTINGS(userId, email, displayName);
    resolvedSettings.email = email;
    setSettings(resolvedSettings);
    setStats(computePerformanceStats(t));
    setEquityCurve(getEquityCurve(t));
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const displayName = (u.user_metadata?.display_name as string) || 'Trader';
        loadAll(u.id, u.email ?? '', displayName).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const displayName = (u.user_metadata?.display_name as string) || 'Trader';
        loadAll(u.id, u.email ?? '', displayName);
      } else {
        setTrades([]); setWeeklyReviews([]); setPsychologyEntries([]); setTradingRules([]);
        setSettings(DEFAULT_SETTINGS('', '', 'Trader'));
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAll]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const displayName = (user.user_metadata?.display_name as string) || 'Trader';
    await loadAll(user.id, user.email ?? '', displayName);
  }, [user, loadAll]);

  const handleAddTrade = useCallback(async (trade: Trade) => {
    await dbAddTrade(trade);
    await refresh();
  }, [refresh]);

  const handleUpdateTrade = useCallback(async (id: string, updates: Partial<Trade>) => {
    await dbUpdateTrade(id, updates);
    await refresh();
  }, [refresh]);

  const handleDeleteTrade = useCallback(async (id: string) => {
    await dbDeleteTrade(id);
    await refresh();
  }, [refresh]);

  const handleSaveWeeklyReview = useCallback(async (review: WeeklyReview) => {
    await dbSaveWeeklyReview(review);
    await refresh();
  }, [refresh]);

  const handleSaveTradingRules = useCallback(async (rules: TradingRule[]) => {
    if (!user) return;
    await dbSaveTradingRules(user.id, rules);
    await refresh();
  }, [user, refresh]);

  const handleSavePsychologyEntry = useCallback(async (entry: PsychologyEntry) => {
    await dbSavePsychologyEntry(entry);
    await refresh();
  }, [refresh]);

  const handleSaveSettings = useCallback(async (s: UserSettings) => {
    await dbSaveSettings(s);
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
      user, trades, dailyNotes, weeklyReviews, tradingRules, psychologyEntries,
      settings, stats, equityCurve, isLoading,
      refreshTrades: refresh,
      addTrade: handleAddTrade, updateTrade: handleUpdateTrade, deleteTrade: handleDeleteTrade,
      saveDailyNote: () => {}, saveWeeklyReview: handleSaveWeeklyReview,
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
