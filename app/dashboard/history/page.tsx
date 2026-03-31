'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { Trade } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PnlBadge } from '@/components/pnl-badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Search, Filter, TrendingUp, TrendingDown, SortAsc, SortDesc, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type SortKey = 'date' | 'pnl' | 'symbol' | 'rMultiple';
type SortDir = 'asc' | 'desc';

export default function HistoryPage() {
  const { trades } = useApp();
  const [search, setSearch] = useState('');
  const [filterDirection, setFilterDirection] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const strategies = useMemo(() => {
    const s = new Set(trades.map(t => t.strategy || t.setup).filter(Boolean) as string[]);
    return Array.from(s).sort();
  }, [trades]);

  const filtered = useMemo(() => {
    let result = [...trades];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.symbol.toLowerCase().includes(q) || (t.strategy || '').toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));
    }
    if (filterDirection !== 'all') result = result.filter(t => t.direction === filterDirection);
    if (filterOutcome !== 'all') result = result.filter(t => t.outcome === filterOutcome);
    if (filterAsset !== 'all') result = result.filter(t => t.assetType === filterAsset);
    if (filterStrategy !== 'all') result = result.filter(t => (t.strategy || t.setup) === filterStrategy);
    if (dateFrom) result = result.filter(t => t.date >= dateFrom);
    if (dateTo) result = result.filter(t => t.date <= dateTo);

    result.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortKey === 'date') { va = a.date + a.time; vb = b.date + b.time; }
      else if (sortKey === 'pnl') { va = a.pnl; vb = b.pnl; }
      else if (sortKey === 'symbol') { va = a.symbol; vb = b.symbol; }
      else if (sortKey === 'rMultiple') { va = a.rMultiple ?? 0; vb = b.rMultiple ?? 0; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return result;
  }, [trades, search, filterDirection, filterOutcome, filterAsset, filterStrategy, dateFrom, dateTo, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const exportCsv = () => {
    const headers = ['Date', 'Time', 'Symbol', 'Direction', 'Asset', 'Entry', 'Exit', 'Size', 'P&L', 'R-Multiple', 'Fees', 'Strategy', 'Outcome', 'Tags'];
    const rows = filtered.map(t => [
      t.date, t.time, t.symbol, t.direction, t.assetType,
      t.entryPrice, t.exitPrice, t.positionSize, t.pnl.toFixed(2),
      t.rMultiple?.toFixed(2) || '', t.fees?.toFixed(2) || '',
      t.strategy || '', t.outcome, (t.tags || []).join(';')
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'trades.csv'; a.click();
    toast.success('Trades exported to CSV');
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? sortDir === 'asc' ? <SortAsc className="w-3 h-3 inline ml-1" /> : <SortDesc className="w-3 h-3 inline ml-1" />
      : null
  );

  const filteredStats = useMemo(() => {
    const wins = filtered.filter(t => t.outcome === 'win');
    const losses = filtered.filter(t => t.outcome === 'loss');
    const totalPnl = filtered.reduce((s, t) => s + t.pnl - (t.fees || 0), 0);
    const winRate = (wins.length + losses.length) > 0 ? (wins.length / (wins.length + losses.length)) * 100 : 0;
    return { totalPnl, winRate, wins: wins.length, losses: losses.length };
  }, [filtered]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} trades · {filteredStats.winRate.toFixed(0)}% win rate</p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {/* Filter summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className={cn('p-3 border text-center', filteredStats.totalPnl >= 0 ? 'border-emerald-500/20' : 'border-red-500/20')}>
          <div className="text-xs text-muted-foreground">Filtered P&L</div>
          <div className={cn('font-bold', filteredStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {filteredStats.totalPnl >= 0 ? '+' : ''}{filteredStats.totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
        </Card>
        <Card className="p-3 border text-center">
          <div className="text-xs text-muted-foreground">Trades</div>
          <div className="font-bold">{filtered.length}</div>
        </Card>
        <Card className="p-3 border text-center">
          <div className="text-xs text-muted-foreground">Wins / Losses</div>
          <div className="font-bold"><span className="text-emerald-400">{filteredStats.wins}</span> / <span className="text-red-400">{filteredStats.losses}</span></div>
        </Card>
        <Card className="p-3 border text-center">
          <div className="text-xs text-muted-foreground">Win Rate</div>
          <div className="font-bold text-blue-400">{filteredStats.winRate.toFixed(1)}%</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search symbol, strategy, notes..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Input type="date" placeholder="From" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <Input type="date" placeholder="To" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Select value={filterDirection} onValueChange={v => { if (v !== null) { setFilterDirection(v); setPage(1); } }}>
            <SelectTrigger><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOutcome} onValueChange={v => { if (v !== null) { setFilterOutcome(v); setPage(1); } }}>
            <SelectTrigger><SelectValue placeholder="Outcome" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="win">Win</SelectItem>
              <SelectItem value="loss">Loss</SelectItem>
              <SelectItem value="breakeven">Breakeven</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAsset} onValueChange={v => { if (v !== null) { setFilterAsset(v); setPage(1); } }}>
            <SelectTrigger><SelectValue placeholder="Asset Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              {['stocks', 'futures', 'forex', 'crypto', 'options', 'indices', 'commodities'].map(a => (
                <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStrategy} onValueChange={v => { if (v !== null) { setFilterStrategy(v); setPage(1); } }}>
            <SelectTrigger><SelectValue placeholder="Strategy" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              {strategies.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('date')}>
                  Date <SortIcon k="date" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('symbol')}>
                  Symbol <SortIcon k="symbol" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Direction</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Strategy</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Entry / Exit</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => toggleSort('pnl')}>
                  P&L <SortIcon k="pnl" />
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell cursor-pointer hover:text-foreground" onClick={() => toggleSort('rMultiple')}>
                  R-Mult <SortIcon k="rMultiple" />
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Result</th>
                <th className="w-8 px-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">No trades match your filters</td>
                </tr>
              ) : paginated.map(trade => (
                <tr key={trade.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    <div>{format(parseISO(trade.date), 'MMM d, yy')}</div>
                    <div className="text-xs opacity-60">{trade.time}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{trade.symbol}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline" className={cn('text-xs', trade.direction === 'long' ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30')}>
                      {trade.direction === 'long' ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                      {trade.direction.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{trade.strategy || trade.setup || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    <span className="tabular-nums">{trade.entryPrice.toFixed(2)}</span>
                    <span className="mx-1 opacity-40">→</span>
                    <span className="tabular-nums">{trade.exitPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PnlBadge value={trade.pnl} />
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {trade.rMultiple !== undefined ? (
                      <span className={cn('font-medium tabular-nums', trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                      trade.outcome === 'win' ? 'bg-emerald-500/15 text-emerald-400'
                        : trade.outcome === 'loss' ? 'bg-red-500/15 text-red-400'
                          : 'bg-slate-500/15 text-slate-400')}>
                      {trade.outcome.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <Link href={`/dashboard/trade/${trade.id}`}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all inline-flex">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
