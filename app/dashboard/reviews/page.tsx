'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { WeeklyReview } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { Plus, FileText, CheckCircle, AlertCircle, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

function generateId() { return `review-${Date.now()}`; }

export default function ReviewsPage() {
  const { trades, weeklyReviews, saveWeeklyReview, user } = useApp();
  const [activeReview, setActiveReview] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    weekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    weekEnd: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    wentWell: '',
    wentWrong: '',
    mostCommonMistake: '',
    bestSetup: '',
    goalForNextWeek: '',
    psychologicalNotes: '',
    disciplineScore: 7,
  });

  const set = (key: string, value: unknown) => setForm(p => ({ ...p, [key]: value }));

  const weekStats = useMemo(() => {
    const weekTrades = trades.filter(t => t.date >= form.weekStart && t.date <= form.weekEnd);
    const wins = weekTrades.filter(t => t.outcome === 'win').length;
    const losses = weekTrades.filter(t => t.outcome === 'loss').length;
    const pnl = weekTrades.reduce((s, t) => s + t.pnl - (t.fees || 0), 0);
    return { trades: weekTrades.length, wins, losses, pnl, winRate: weekTrades.length > 0 ? ((wins / (wins + losses)) * 100).toFixed(0) : 0 };
  }, [trades, form.weekStart, form.weekEnd]);

  const handleSave = () => {
    const review: WeeklyReview = {
      id: generateId(),
      userId: user?.id ?? '',
      weekStart: form.weekStart,
      weekEnd: form.weekEnd,
      totalPnl: weekStats.pnl,
      tradeCount: weekStats.trades,
      winRate: parseFloat(weekStats.winRate as string),
      wentWell: form.wentWell || undefined,
      wentWrong: form.wentWrong || undefined,
      mostCommonMistake: form.mostCommonMistake || undefined,
      bestSetup: form.bestSetup || undefined,
      goalForNextWeek: form.goalForNextWeek || undefined,
      psychologicalNotes: form.psychologicalNotes || undefined,
      disciplineScore: form.disciplineScore,
      createdAt: new Date().toISOString(),
    };
    saveWeeklyReview(review);
    toast.success('Weekly review saved');
    setShowForm(false);
  };

  const sortedReviews = [...weeklyReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Weekly and monthly performance reflections</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
          <Plus className="w-4 h-4" />New Review
        </Button>
      </div>

      {/* New review form */}
      {showForm && (
        <Card className="p-6 border border-blue-500/20 bg-blue-500/5 space-y-5">
          <h2 className="font-semibold text-blue-400">New Weekly Review</h2>

          {/* Week range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Week Start</Label>
              <Input type="date" value={form.weekStart} onChange={e => set('weekStart', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Week End</Label>
              <Input type="date" value={form.weekEnd} onChange={e => set('weekEnd', e.target.value)} />
            </div>
          </div>

          {/* Auto stats */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Trades</div>
              <div className="font-bold">{weekStats.trades}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">P&L</div>
              <div className={cn('font-bold', weekStats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {weekStats.pnl >= 0 ? '+' : ''}{weekStats.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Win Rate</div>
              <div className="font-bold text-blue-400">{weekStats.winRate}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">W / L</div>
              <div className="font-bold"><span className="text-emerald-400">{weekStats.wins}</span>/<span className="text-red-400">{weekStats.losses}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" />What went well?</Label>
              <Textarea placeholder="Successes, good executions, discipline wins..." rows={3} value={form.wentWell} onChange={e => set('wentWell', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 text-red-400" />What went wrong?</Label>
              <Textarea placeholder="Mistakes, missed opportunities, areas to improve..." rows={3} value={form.wentWrong} onChange={e => set('wentWrong', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Most common mistake</Label>
              <Input placeholder="e.g. Exiting too early" value={form.mostCommonMistake} onChange={e => set('mostCommonMistake', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Best setup this week</Label>
              <Input placeholder="e.g. FVG Fill on NQ open" value={form.bestSetup} onChange={e => set('bestSetup', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-blue-400" />Goal for next week</Label>
              <Input placeholder="What will you focus on improving?" value={form.goalForNextWeek} onChange={e => set('goalForNextWeek', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Psychological notes</Label>
            <Textarea placeholder="How did you feel this week? What mental patterns did you notice?" rows={3} value={form.psychologicalNotes} onChange={e => set('psychologicalNotes', e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Discipline Score: {form.disciplineScore}/10</Label>
            <Slider min={1} max={10} step={1} value={[form.disciplineScore]}
              onValueChange={(v) => { const arr = Array.isArray(v) ? v : [v]; set('disciplineScore', arr[0]); }} />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white">Save Review</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {sortedReviews.length === 0 ? (
          <Card className="p-12 border text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Start your first weekly review to track your growth as a trader.</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
              <Plus className="w-4 h-4" />Write First Review
            </Button>
          </Card>
        ) : sortedReviews.map(review => (
          <Card key={review.id} className={cn('border overflow-hidden', activeReview === review.id ? 'border-blue-500/30' : '')}>
            <button
              onClick={() => setActiveReview(activeReview === review.id ? null : review.id)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn('p-2 rounded-lg', review.totalPnl >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                  <FileText className={cn('w-4 h-4', review.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')} />
                </div>
                <div>
                  <div className="font-semibold text-sm">
                    {format(new Date(review.weekStart), 'MMM d')} – {format(new Date(review.weekEnd), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                    <span>{review.tradeCount} trades</span>
                    <span>{review.winRate}% win rate</span>
                    {review.disciplineScore && <span>Discipline: {review.disciplineScore}/10</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn('font-bold', review.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {review.totalPnl >= 0 ? '+' : ''}{review.totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
                {activeReview === review.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {activeReview === review.id && (
              <div className="px-5 pb-5 border-t border-border space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {review.wentWell && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-2"><CheckCircle className="w-3.5 h-3.5" />What went well</div>
                      <p className="text-sm text-muted-foreground">{review.wentWell}</p>
                    </div>
                  )}
                  {review.wentWrong && (
                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2"><AlertCircle className="w-3.5 h-3.5" />What went wrong</div>
                      <p className="text-sm text-muted-foreground">{review.wentWrong}</p>
                    </div>
                  )}
                  {review.goalForNextWeek && (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-xs font-medium text-blue-400 mb-2"><Target className="w-3.5 h-3.5" />Next week goal</div>
                      <p className="text-sm text-muted-foreground">{review.goalForNextWeek}</p>
                    </div>
                  )}
                  {review.psychologicalNotes && (
                    <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg">
                      <div className="text-xs font-medium text-violet-400 mb-2">Psychological notes</div>
                      <p className="text-sm text-muted-foreground">{review.psychologicalNotes}</p>
                    </div>
                  )}
                </div>
                {(review.bestSetup || review.mostCommonMistake) && (
                  <div className="flex gap-4 text-sm">
                    {review.bestSetup && <span><span className="text-muted-foreground">Best setup:</span> <span className="font-medium">{review.bestSetup}</span></span>}
                    {review.mostCommonMistake && <span><span className="text-muted-foreground">Top mistake:</span> <span className="text-red-400">{review.mostCommonMistake}</span></span>}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
