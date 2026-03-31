'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/context';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, ScatterChart, Scatter, ReferenceLine
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SESSIONS = { london: 'London', new_york: 'New York', asia: 'Asia', london_ny_overlap: 'Overlap', pre_market: 'Pre-Mkt', after_hours: 'After Hrs', custom: 'Custom' };

const ChartTooltip = ({ active, payload, label, prefix = '$' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs">
      <div className="text-muted-foreground mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' ? `${prefix}${p.value >= 0 ? '' : '-'}${Math.abs(p.value).toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { trades, equityCurve } = useApp();

  const setupPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number; wins: number }>();
    trades.forEach(t => {
      const s = t.strategy || t.setup || 'Unknown';
      const e = map.get(s) || { pnl: 0, count: 0, wins: 0 };
      e.pnl += t.pnl; e.count++; if (t.outcome === 'win') e.wins++;
      map.set(s, e);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, pnl: parseFloat(d.pnl.toFixed(2)), count: d.count, winRate: parseFloat(((d.wins / d.count) * 100).toFixed(1)) }))
      .sort((a, b) => b.pnl - a.pnl).slice(0, 10);
  }, [trades]);

  const symbolPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number; wins: number }>();
    trades.forEach(t => {
      const e = map.get(t.symbol) || { pnl: 0, count: 0, wins: 0 };
      e.pnl += t.pnl; e.count++; if (t.outcome === 'win') e.wins++;
      map.set(t.symbol, e);
    });
    return Array.from(map.entries())
      .map(([name, d]) => ({ name, pnl: parseFloat(d.pnl.toFixed(2)), count: d.count, winRate: parseFloat(((d.wins / d.count) * 100).toFixed(1)) }))
      .sort((a, b) => b.count - a.count).slice(0, 12);
  }, [trades]);

  const weekdayPerf = useMemo(() => {
    const map = new Map<number, { pnl: number; count: number; wins: number }>();
    trades.forEach(t => {
      const dow = parseISO(t.date).getDay();
      const e = map.get(dow) || { pnl: 0, count: 0, wins: 0 };
      e.pnl += t.pnl; e.count++; if (t.outcome === 'win') e.wins++;
      map.set(dow, e);
    });
    return [1, 2, 3, 4, 5].map(d => {
      const e = map.get(d) || { pnl: 0, count: 0, wins: 0 };
      return { name: DAYS[d].slice(0, 3), pnl: parseFloat(e.pnl.toFixed(2)), count: e.count, winRate: e.count > 0 ? parseFloat(((e.wins / e.count) * 100).toFixed(1)) : 0 };
    });
  }, [trades]);

  const sessionPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number; wins: number }>();
    trades.forEach(t => {
      const s = t.session || 'custom';
      const e = map.get(s) || { pnl: 0, count: 0, wins: 0 };
      e.pnl += t.pnl; e.count++; if (t.outcome === 'win') e.wins++;
      map.set(s, e);
    });
    return Array.from(map.entries()).map(([key, d]) => ({
      name: SESSIONS[key as keyof typeof SESSIONS] || key,
      pnl: parseFloat(d.pnl.toFixed(2)), count: d.count,
      winRate: parseFloat(((d.wins / d.count) * 100).toFixed(1))
    })).sort((a, b) => b.count - a.count);
  }, [trades]);

  const directionPerf = useMemo(() => {
    const long = trades.filter(t => t.direction === 'long');
    const short = trades.filter(t => t.direction === 'short');
    const calc = (arr: typeof trades) => ({
      pnl: parseFloat(arr.reduce((s, t) => s + t.pnl, 0).toFixed(2)),
      wins: arr.filter(t => t.outcome === 'win').length,
      count: arr.length,
      winRate: arr.length > 0 ? parseFloat(((arr.filter(t => t.outcome === 'win').length / arr.length) * 100).toFixed(1)) : 0
    });
    return [
      { name: 'Long', ...calc(long), fill: '#10b981' },
      { name: 'Short', ...calc(short), fill: '#ef4444' },
    ];
  }, [trades]);

  const monthlyPerf = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => {
      const m = t.date.slice(0, 7);
      map.set(m, (map.get(m) || 0) + t.pnl - (t.fees || 0));
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, pnl]) => ({ name: format(parseISO(month + '-01'), 'MMM yy'), pnl: parseFloat(pnl.toFixed(2)) }));
  }, [trades]);

  const rDistribution = useMemo(() => {
    const buckets = new Map<string, number>();
    const labels = ['< -3R', '-3R to -2R', '-2R to -1R', '-1R to 0R', '0R to 1R', '1R to 2R', '2R to 3R', '> 3R'];
    labels.forEach(l => buckets.set(l, 0));
    trades.forEach(t => {
      if (t.rMultiple === undefined) return;
      const r = t.rMultiple;
      if (r < -3) buckets.set('< -3R', (buckets.get('< -3R') || 0) + 1);
      else if (r < -2) buckets.set('-3R to -2R', (buckets.get('-3R to -2R') || 0) + 1);
      else if (r < -1) buckets.set('-2R to -1R', (buckets.get('-2R to -1R') || 0) + 1);
      else if (r < 0) buckets.set('-1R to 0R', (buckets.get('-1R to 0R') || 0) + 1);
      else if (r < 1) buckets.set('0R to 1R', (buckets.get('0R to 1R') || 0) + 1);
      else if (r < 2) buckets.set('1R to 2R', (buckets.get('1R to 2R') || 0) + 1);
      else if (r < 3) buckets.set('2R to 3R', (buckets.get('2R to 3R') || 0) + 1);
      else buckets.set('> 3R', (buckets.get('> 3R') || 0) + 1);
    });
    return labels.map(name => ({ name, count: buckets.get(name) || 0, fill: name.startsWith('-') || name.startsWith('<') ? '#ef4444' : '#10b981' }));
  }, [trades]);

  const mistakeFreq = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach(t => (t.mistakes || []).forEach(m => map.set(m, (map.get(m) || 0) + 1)));
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [trades]);

  const drawdownData = useMemo(() => {
    return equityCurve.slice(-60).map(p => ({
      date: format(parseISO(p.date), 'MMM d'),
      drawdown: -p.drawdown,
    }));
  }, [equityCurve]);

  const emotionPerf = useMemo(() => {
    const map = new Map<string, { pnl: number; count: number }>();
    trades.forEach(t => {
      if (!t.emotionBefore) return;
      const e = map.get(t.emotionBefore) || { pnl: 0, count: 0 };
      e.pnl += t.pnl; e.count++;
      map.set(t.emotionBefore, e);
    });
    return Array.from(map.entries())
      .map(([emotion, d]) => ({ emotion, avgPnl: parseFloat((d.pnl / d.count).toFixed(2)), count: d.count }))
      .sort((a, b) => b.avgPnl - a.avgPnl);
  }, [trades]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Deep performance insights across {trades.length} trades</p>
      </div>

      <Tabs defaultValue="performance">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="setups">Setups</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="risk">Risk & R</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
        </TabsList>

        {/* PERFORMANCE TAB */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Monthly P&L</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPerf} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                    <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}
                      fill="#10b981"
                      label={false}
                    >
                      {monthlyPerf.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Long vs Short</h3>
              <div className="h-56 flex items-center">
                <div className="w-48 mx-auto">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={directionPerf} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count" paddingAngle={4}>
                        {directionPerf.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                      <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4">
                  {directionPerf.map(d => (
                    <div key={d.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: d.fill }} className="font-medium">{d.name}</span>
                        <span className={cn('font-bold', d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                          {d.pnl >= 0 ? '+' : ''}{d.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">{d.count} trades · {d.winRate}% win</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Symbol Performance</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={symbolPerf} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                    <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
                      {symbolPerf.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Drawdown</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={drawdownData} margin={{ left: -10 }}>
                    <defs>
                      <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(1)}%`} />
                    <Tooltip content={<ChartTooltip prefix="%" />} />
                    <Area type="monotone" dataKey="drawdown" name="Drawdown" stroke="#ef4444" strokeWidth={2} fill="url(#ddGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* SETUPS TAB */}
        <TabsContent value="setups" className="space-y-6 mt-6">
          <Card className="p-6 border">
            <h3 className="font-semibold mb-4">P&L by Setup / Strategy</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupPerf} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                  <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                    {setupPerf.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {setupPerf.map((s, i) => (
              <Card key={s.name} className="p-4 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{s.name}</span>
                  <span className={cn('text-sm font-bold', s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {s.pnl >= 0 ? '+' : ''}{s.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{s.count} trades</span>
                  <span className="text-blue-400">{s.winRate}% win</span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', s.winRate >= 50 ? 'bg-emerald-500' : 'bg-red-500')} style={{ width: `${s.winRate}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TIMING TAB */}
        <TabsContent value="timing" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Performance by Weekday</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayPerf} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                    <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                      {weekdayPerf.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Performance by Session</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionPerf} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                    <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                      {sessionPerf.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* RISK TAB */}
        <TabsContent value="risk" className="space-y-6 mt-6">
          <Card className="p-6 border">
            <h3 className="font-semibold mb-4">R-Multiple Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rDistribution} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip prefix="" />} />
                  <Bar dataKey="count" name="Trades" radius={[4, 4, 0, 0]}>
                    {rDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* PSYCHOLOGY TAB */}
        <TabsContent value="psychology" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Avg P&L by Pre-Trade Emotion</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionPerf} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="emotion" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                    <Bar dataKey="avgPnl" name="Avg P&L" radius={[0, 4, 4, 0]}>
                      {emotionPerf.map((entry, i) => <Cell key={i} fill={entry.avgPnl >= 0 ? '#10b981' : '#ef4444'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border">
              <h3 className="font-semibold mb-4">Most Common Mistakes</h3>
              {mistakeFreq.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No mistakes logged yet — great discipline!</div>
              ) : (
                <div className="space-y-3">
                  {mistakeFreq.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="w-5 text-xs text-muted-foreground text-right shrink-0">{i + 1}.</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{m.name}</span>
                          <span className="text-red-400 font-medium">{m.count}×</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(m.count / mistakeFreq[0].count) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
