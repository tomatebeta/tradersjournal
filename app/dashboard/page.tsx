'use client';

import { useApp } from '@/lib/context';
import { StatCard } from '@/components/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PnlBadge } from '@/components/pnl-badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  TrendingUp, TrendingDown, Activity, Target, Zap, Award, AlertTriangle,
  ArrowUpRight, ArrowDownRight, DollarSign, BarChart2, Percent, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <div className="text-muted-foreground mb-1">{label}</div>
      <div className="font-bold text-sm" style={{ color: d?.equity >= 0 ? '#10b981' : '#ef4444' }}>
        ${d?.equity?.toLocaleString()}
      </div>
      <div className={cn('text-xs', d?.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
        {d?.pnl >= 0 ? '+' : ''}{d?.pnl?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { stats, equityCurve, trades, isLoading, settings } = useApp();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  const recentTrades = [...trades].sort((a, b) => {
    const da = new Date(a.date + 'T' + a.time).getTime();
    const db = new Date(b.date + 'T' + b.time).getTime();
    return db - da;
  }).slice(0, 10);

  const chartData = equityCurve.slice(-60).map(p => ({
    ...p,
    date: format(parseISO(p.date), 'MMM d'),
  }));

  const startEquity = settings.defaultAccountSize;
  const gradientId = 'equityGradient';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Your trading performance overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/add-trade">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
              <TrendingUp className="w-4 h-4" />
              Log Trade
            </Button>
          </Link>
        </div>
      </div>

      {/* Streak & Today's banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn('p-4 border flex items-center gap-4', stats.currentStreak.type === 'win' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5')}>
          <div className={cn('p-3 rounded-xl', stats.currentStreak.type === 'win' ? 'bg-emerald-500/15' : 'bg-red-500/15')}>
            <Zap className={cn('w-5 h-5', stats.currentStreak.type === 'win' ? 'text-emerald-400' : 'text-red-400')} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Current Streak</div>
            <div className={cn('text-xl font-bold', stats.currentStreak.type === 'win' ? 'text-emerald-400' : 'text-red-400')}>
              {stats.currentStreak.count} {stats.currentStreak.type === 'win' ? 'Wins' : 'Losses'}
            </div>
          </div>
        </Card>

        <Card className="p-4 border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/15">
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</div>
            <div className="text-xl font-bold text-blue-400">{stats.winRate}%</div>
          </div>
        </Card>

        <Card className="p-4 border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/15">
            <Target className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Profit Factor</div>
            <div className="text-xl font-bold text-violet-400">{isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : '∞'}</div>
          </div>
        </Card>

        <Card className="p-4 border flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/15">
            <BarChart2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Risk/Reward</div>
            <div className="text-xl font-bold text-amber-400">{stats.riskReward.toFixed(2)}R</div>
          </div>
        </Card>
      </div>

      {/* P&L Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total P&L"
          value={(stats.totalPnl >= 0 ? '+' : '') + stats.totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          subtitle={`${stats.wins}W / ${stats.losses}L`}
          icon={<DollarSign />}
          variant={stats.totalPnl >= 0 ? 'profit' : 'loss'}
        />
        <StatCard
          title="Today's P&L"
          value={(stats.todayPnl >= 0 ? '+' : '') + stats.todayPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          subtitle="Today"
          icon={<Calendar />}
          variant={stats.todayPnl > 0 ? 'profit' : stats.todayPnl < 0 ? 'loss' : 'neutral'}
        />
        <StatCard
          title="This Week"
          value={(stats.weekPnl >= 0 ? '+' : '') + stats.weekPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          subtitle="Current week"
          icon={<TrendingUp />}
          variant={stats.weekPnl > 0 ? 'profit' : stats.weekPnl < 0 ? 'loss' : 'neutral'}
        />
        <StatCard
          title="This Month"
          value={(stats.monthPnl >= 0 ? '+' : '') + stats.monthPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          subtitle="Current month"
          icon={<Award />}
          variant={stats.monthPnl > 0 ? 'profit' : stats.monthPnl < 0 ? 'loss' : 'neutral'}
        />
      </div>

      {/* Equity Curve */}
      <Card className="p-6 border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-base">Equity Curve</h2>
            <p className="text-xs text-muted-foreground">Last 60 trading days</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-muted-foreground">Loss</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={startEquity} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Area
                type="monotone" dataKey="equity"
                stroke="#10b981" strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false} activeDot={{ r: 4, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Trades" value={stats.totalTrades.toString()} subtitle={`${stats.breakevens} breakeven`} icon={<Activity />} variant="info" />
        <StatCard title="Avg Win" value={`+${stats.avgWin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`} icon={<ArrowUpRight />} variant="profit" />
        <StatCard title="Avg Loss" value={`-${stats.avgLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`} icon={<ArrowDownRight />} variant="loss" />
        <StatCard title="Largest Win" value={`+${stats.largestWin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`} icon={<Award />} variant="profit" />
      </div>

      {/* Best/Worst Day & Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best/Worst */}
        <div className="space-y-4">
          {stats.bestDay && (
            <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best Day</span>
              </div>
              <div className="text-lg font-bold text-emerald-400">+{stats.bestDay.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
              <div className="text-xs text-muted-foreground">{format(parseISO(stats.bestDay.date), 'MMM d, yyyy')} · {stats.bestDay.trades} trades</div>
            </Card>
          )}
          {stats.worstDay && (
            <Card className="p-4 border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Worst Day</span>
              </div>
              <div className="text-lg font-bold text-red-400">{stats.worstDay.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
              <div className="text-xs text-muted-foreground">{format(parseISO(stats.worstDay.date), 'MMM d, yyyy')} · {stats.worstDay.trades} trades</div>
            </Card>
          )}
          <Card className="p-4 border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Trade Breakdown</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-emerald-400">Wins</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stats.totalTrades > 0 ? (stats.wins / stats.totalTrades) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{stats.wins}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-400">Losses</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${stats.totalTrades > 0 ? (stats.losses / stats.totalTrades) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{stats.losses}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Breakeven</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: `${stats.totalTrades > 0 ? (stats.breakevens / stats.totalTrades) * 100 : 0}%` }} />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{stats.breakevens}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Trades */}
        <Card className="lg:col-span-2 p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">Recent Trades</h2>
            <Link href="/dashboard/history" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No trades logged yet</div>
            ) : (
              recentTrades.map(trade => (
                <Link
                  key={trade.id}
                  href={`/dashboard/trade/${trade.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', trade.outcome === 'win' ? 'bg-emerald-400' : trade.outcome === 'loss' ? 'bg-red-400' : 'bg-slate-400')} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{trade.symbol}</span>
                        <Badge variant="outline" className={cn('text-xs px-1.5 py-0', trade.direction === 'long' ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30')}>
                          {trade.direction.toUpperCase()}
                        </Badge>
                        {trade.strategy && <span className="text-xs text-muted-foreground hidden sm:inline">{trade.strategy}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{format(parseISO(trade.date), 'MMM d')} · {trade.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <PnlBadge value={trade.pnl} />
                    {trade.rMultiple !== undefined && (
                      <div className="text-xs text-muted-foreground">{trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R</div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
