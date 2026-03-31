'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, parseISO, getDay
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Trade } from '@/lib/types';
import { PnlBadge } from '@/components/pnl-badge';
import Link from 'next/link';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { trades } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach(t => {
      const key = t.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [trades]);

  const dailyPnl = useMemo(() => {
    const map = new Map<string, number>();
    tradesByDate.forEach((ts, date) => {
      map.set(date, ts.reduce((s, t) => s + t.pnl - (t.fees || 0), 0));
    });
    return map;
  }, [tradesByDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const monthStats = useMemo(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    const monthTrades = trades.filter(t => t.date.startsWith(monthStr));
    const pnl = monthTrades.reduce((s, t) => s + t.pnl - (t.fees || 0), 0);
    const wins = monthTrades.filter(t => t.outcome === 'win').length;
    const days = new Set(monthTrades.map(t => t.date)).size;
    return { pnl, trades: monthTrades.length, wins, days };
  }, [trades, currentMonth]);

  // Weekly totals
  const weeks = useMemo(() => {
    const result: { start: Date; end: Date; pnl: number; trades: number }[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      const week = calendarDays.slice(i, i + 7);
      const weekStart = week[0];
      const weekEnd = week[week.length - 1];
      let pnl = 0, count = 0;
      week.forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        if (isSameMonth(day, currentMonth)) {
          const dayPnl = dailyPnl.get(key) || 0;
          const dayTrades = tradesByDate.get(key)?.length || 0;
          pnl += dayPnl;
          count += dayTrades;
        }
      });
      result.push({ start: weekStart, end: weekEnd, pnl: parseFloat(pnl.toFixed(2)), trades: count });
    }
    return result;
  }, [calendarDays, currentMonth, dailyPnl, tradesByDate]);

  const selectedDayTrades = useMemo(() => {
    if (!selectedDay) return [];
    return tradesByDate.get(format(selectedDay, 'yyyy-MM-dd')) || [];
  }, [selectedDay, tradesByDate]);

  const selectedDayPnl = useMemo(() => {
    if (!selectedDay) return 0;
    return dailyPnl.get(format(selectedDay, 'yyyy-MM-dd')) || 0;
  }, [selectedDay, dailyPnl]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Calendar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Daily P&L overview · click any day to drill down</p>
        </div>
      </div>

      {/* Month summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className={cn('p-4 border', monthStats.pnl >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5')}>
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Month P&L</div>
          <div className={cn('text-xl font-bold', monthStats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {monthStats.pnl >= 0 ? '+' : ''}{monthStats.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </Card>
        <Card className="p-4 border">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Trades</div>
          <div className="text-xl font-bold">{monthStats.trades}</div>
        </Card>
        <Card className="p-4 border">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Trading Days</div>
          <div className="text-xl font-bold">{monthStats.days}</div>
        </Card>
        <Card className="p-4 border">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Win Rate</div>
          <div className="text-xl font-bold text-blue-400">
            {monthStats.trades > 0 ? ((monthStats.wins / monthStats.trades) * 100).toFixed(0) : 0}%
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="border overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-base font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-8 border-b border-border">
              {WEEKDAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0 first:col-start-1">
                  {d}
                </div>
              ))}
              <div className="py-2 text-center text-xs font-medium text-muted-foreground bg-muted/30">Week</div>
            </div>

            {/* Calendar grid */}
            <div>
              {weeks.map((week, wi) => {
                const weekDays = calendarDays.slice(wi * 7, wi * 7 + 7);
                return (
                  <div key={wi} className="grid grid-cols-8 border-b border-border last:border-b-0">
                    {weekDays.map((day, di) => {
                      const key = format(day, 'yyyy-MM-dd');
                      const inMonth = isSameMonth(day, currentMonth);
                      const pnl = dailyPnl.get(key);
                      const tradeCount = tradesByDate.get(key)?.length || 0;
                      const isSelected = selectedDay && isSameDay(day, selectedDay);
                      const today = isToday(day);
                      const isWeekend = getDay(day) === 0 || getDay(day) === 6;

                      return (
                        <button
                          key={di}
                          onClick={() => inMonth && tradeCount > 0 && setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                          className={cn(
                            'min-h-[72px] p-2 text-left border-r border-border last:border-r-0 transition-all',
                            !inMonth ? 'opacity-25 cursor-default' : tradeCount > 0 ? 'cursor-pointer hover:bg-muted/40' : 'cursor-default',
                            isSelected ? 'bg-blue-600/10 border border-blue-500/30' : '',
                            isWeekend && inMonth ? 'bg-muted/20' : '',
                          )}
                        >
                          <div className={cn(
                            'text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                            today ? 'bg-blue-600 text-white' : inMonth ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {format(day, 'd')}
                          </div>
                          {inMonth && pnl !== undefined && (
                            <>
                              <div className={cn(
                                'text-xs font-bold leading-tight',
                                pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-muted-foreground'
                              )}>
                                {pnl >= 0 ? '+' : ''}{Math.abs(pnl) >= 1000
                                  ? `${pnl >= 0 ? '' : '-'}$${(Math.abs(pnl) / 1000).toFixed(1)}k`
                                  : pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                              </div>
                              <div className={cn(
                                'mt-0.5 text-xs rounded px-1 inline-block',
                                pnl > 0 ? 'text-emerald-400/70' : pnl < 0 ? 'text-red-400/70' : 'text-muted-foreground'
                              )}>
                                {tradeCount}T
                              </div>
                              <div className={cn(
                                'mt-1 h-1 rounded-full',
                                pnl > 0 ? 'bg-emerald-500/60' : pnl < 0 ? 'bg-red-500/60' : 'bg-slate-500/40'
                              )} style={{ width: `${Math.min(100, Math.abs(pnl) / 30)}%` }} />
                            </>
                          )}
                        </button>
                      );
                    })}
                    {/* Weekly total */}
                    <div className={cn('min-h-[72px] p-2 flex flex-col justify-center items-center bg-muted/20', week.trades === 0 ? 'opacity-40' : '')}>
                      <div className="text-xs text-muted-foreground mb-1">Wk {wi + 1}</div>
                      {week.trades > 0 && (
                        <>
                          <div className={cn('text-xs font-bold', week.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                            {week.pnl >= 0 ? '+' : ''}{Math.abs(week.pnl) >= 1000
                              ? `${week.pnl >= 0 ? '' : '-'}$${(Math.abs(week.pnl) / 1000).toFixed(1)}k`
                              : week.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </div>
                          <div className="text-xs text-muted-foreground">{week.trades}T</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 px-6 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/40" /><span>Profitable day</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/40" /><span>Losing day</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-500/30" /><span>No trades</span></div>
            </div>
          </Card>
        </div>

        {/* Day detail panel */}
        <div>
          {selectedDay ? (
            <Card className="border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="font-semibold">{format(selectedDay, 'EEEE')}</div>
                  <div className="text-sm text-muted-foreground">{format(selectedDay, 'MMMM d, yyyy')}</div>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Day stats */}
              <div className="px-5 py-4 border-b border-border space-y-3">
                <div className={cn('text-2xl font-bold', selectedDayPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {selectedDayPnl >= 0 ? '+' : ''}{selectedDayPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Trades</div>
                    <div className="font-semibold">{selectedDayTrades.length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Wins</div>
                    <div className="font-semibold text-emerald-400">{selectedDayTrades.filter(t => t.outcome === 'win').length}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Losses</div>
                    <div className="font-semibold text-red-400">{selectedDayTrades.filter(t => t.outcome === 'loss').length}</div>
                  </div>
                </div>
              </div>

              {/* Trade list */}
              <div className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
                {selectedDayTrades.map(trade => (
                  <Link key={trade.id} href={`/dashboard/trade/${trade.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-2 h-2 rounded-full', trade.outcome === 'win' ? 'bg-emerald-400' : trade.outcome === 'loss' ? 'bg-red-400' : 'bg-slate-400')} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{trade.symbol}</span>
                          <Badge variant="outline" className={cn('text-xs px-1.5 py-0', trade.direction === 'long' ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30')}>
                            {trade.direction.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{trade.time} · {trade.strategy || trade.setup}</div>
                      </div>
                    </div>
                    <PnlBadge value={trade.pnl} size="sm" />
                  </Link>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="border p-8 text-center">
              <Activity className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a day with trades to see the daily breakdown</p>
            </Card>
          )}

          {/* Weekly summary */}
          <Card className="border mt-4 overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="font-semibold text-sm">Weekly Breakdown</h3>
            </div>
            <div className="divide-y divide-border">
              {weeks.filter(w => w.trades > 0).map((week, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="text-xs text-muted-foreground">
                    {format(week.start, 'MMM d')} – {format(week.end, 'MMM d')}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{week.trades} trades</span>
                    <span className={cn('text-sm font-semibold', week.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {week.pnl >= 0 ? '+' : ''}{week.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  </div>
                </div>
              ))}
              {weeks.every(w => w.trades === 0) && (
                <div className="px-5 py-4 text-xs text-muted-foreground text-center">No trades this month</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
