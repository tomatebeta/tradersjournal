'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Trade, AssetType, Direction, Session, Timeframe, EmotionType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Plus, X, ArrowLeft, Save } from 'lucide-react';

const TAG_OPTIONS = ['FVG', 'breakout', 'pullback', 'trend', 'reversal', 'scalping', 'swing', 'momentum', 'mean-reversion', 'gap-fill', 'vwap', 'support', 'resistance', 'order-block', 'ict', 'smc', 'news-play'];
const EMOTIONS: EmotionType[] = ['calm', 'confident', 'focused', 'neutral', 'anxious', 'fearful', 'greedy', 'frustrated', 'overconfident', 'revenge'];
const MISTAKES = ['Sized too big', 'Moved stop too early', 'Chased entry', 'No clear setup', 'Ignored news', 'Exited too early', 'Added to loser', 'Revenge traded', 'Over-traded', 'FOMO entry', 'Early exit', 'Late entry'];


function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function AddTradePage() {
  const router = useRouter();
  const { addTrade, user } = useApp();

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    symbol: '',
    assetType: 'stocks' as AssetType,
    direction: 'long' as Direction,
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    positionSize: '',
    riskAmount: '',
    fees: '',
    leverage: '',
    strategy: '',
    timeframe: '15m' as Timeframe,
    session: 'new_york' as Session,
    confidenceRating: 7,
    emotionBefore: 'neutral' as EmotionType,
    emotionAfter: 'neutral' as EmotionType,
    notes: '',
    lessonsLearned: '',
    tags: [] as string[],
    mistakes: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const pnl = (() => {
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const size = parseFloat(form.positionSize);
    if (!entry || !exit || !size) return null;
    const raw = form.direction === 'long' ? (exit - entry) * size : (entry - exit) * size;
    return raw - (parseFloat(form.fees) || 0);
  })();

  const rMultiple = (() => {
    if (!pnl || !form.riskAmount) return null;
    const risk = parseFloat(form.riskAmount);
    if (!risk) return null;
    return parseFloat((pnl / risk).toFixed(2));
  })();

  const set = (key: string, value: unknown) => setForm(p => ({ ...p, [key]: value }));

  const toggleTag = (tag: string) => {
    set('tags', form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag]);
  };

  const toggleMistake = (mistake: string) => {
    set('mistakes', form.mistakes.includes(mistake) ? form.mistakes.filter(m => m !== mistake) : [...form.mistakes, mistake]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.symbol.trim()) e.symbol = 'Symbol is required';
    if (!form.entryPrice) e.entryPrice = 'Entry price required';
    if (!form.exitPrice) e.exitPrice = 'Exit price required';
    if (!form.positionSize) e.positionSize = 'Position size required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!user?.id) { toast.error('Not signed in'); return; }
    const entry = parseFloat(form.entryPrice);
    const exit = parseFloat(form.exitPrice);
    const size = parseFloat(form.positionSize);
    const fees = parseFloat(form.fees) || 0;
    const calculatedPnl = (form.direction === 'long' ? (exit - entry) * size : (entry - exit) * size) - fees;
    const outcome = Math.abs(calculatedPnl) < 1 ? 'breakeven' : calculatedPnl > 0 ? 'win' : 'loss';
    const risk = parseFloat(form.riskAmount) || 0;
    const trade: Trade = {
      id: crypto.randomUUID(),
      userId: user.id,
      date: form.date,
      time: form.time,
      symbol: form.symbol.toUpperCase().trim(),
      assetType: form.assetType,
      direction: form.direction,
      entryPrice: entry,
      exitPrice: exit,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : undefined,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : undefined,
      positionSize: size,
      riskAmount: risk || undefined,
      leverage: form.leverage ? parseFloat(form.leverage) : undefined,
      pnl: parseFloat(calculatedPnl.toFixed(2)),
      rMultiple: risk > 0 ? parseFloat((calculatedPnl / risk).toFixed(2)) : undefined,
      fees,
      strategy: form.strategy || undefined,
      setup: form.strategy || undefined,
      timeframe: form.timeframe,
      session: form.session,
      confidenceRating: form.confidenceRating,
      emotionBefore: form.emotionBefore,
      emotionAfter: form.emotionAfter,
      notes: form.notes || undefined,
      lessonsLearned: form.lessonsLearned || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      mistakes: form.mistakes.length > 0 ? form.mistakes : undefined,
      images: [],
      outcome,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSubmitting(true);
    try {
      await addTrade(trade);
      toast.success('Trade logged successfully', { description: `${trade.symbol} ${trade.direction} · ${calculatedPnl >= 0 ? '+' : ''}${calculatedPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` });
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to save trade', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Log Trade</h1>
          <p className="text-muted-foreground text-sm">Record a new trade entry</p>
        </div>
      </div>

      {/* Live P&L Preview */}
      {pnl !== null && (
        <div className={cn('flex items-center gap-4 p-4 rounded-xl border', pnl >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5')}>
          {pnl >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          <div>
            <div className="text-xs text-muted-foreground">Calculated P&L</div>
            <div className={cn('text-2xl font-bold', pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {pnl >= 0 ? '+' : ''}{pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </div>
          {rMultiple !== null && (
            <div className="ml-6">
              <div className="text-xs text-muted-foreground">R-Multiple</div>
              <div className={cn('text-2xl font-bold', rMultiple >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {rMultiple >= 0 ? '+' : ''}{rMultiple}R
              </div>
            </div>
          )}
          <Badge className={cn('ml-auto', pnl >= 0 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30')}>
            {pnl >= 0 ? 'WIN' : 'LOSS'}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-6 border space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Trade Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date" error={errors.date}>
                <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </Field>
              <Field label="Time">
                <Input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Symbol" error={errors.symbol}>
                <Input placeholder="e.g. NQ, AAPL, BTC/USD" value={form.symbol} onChange={e => set('symbol', e.target.value)} className={errors.symbol ? 'border-red-500' : ''} />
              </Field>
              <Field label="Asset Type">
                <Select value={form.assetType} onValueChange={v => set('assetType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['stocks', 'futures', 'forex', 'crypto', 'options', 'indices', 'commodities'] as AssetType[]).map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Direction */}
            <Field label="Direction">
              <div className="flex gap-3">
                {(['long', 'short'] as Direction[]).map(d => (
                  <button key={d} onClick={() => set('direction', d)}
                    className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-all',
                      form.direction === d
                        ? d === 'long' ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400' : 'border-red-500 bg-red-500/15 text-red-400'
                        : 'border-border text-muted-foreground hover:border-muted-foreground')}>
                    {d === 'long' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </Field>
          </Card>

          {/* Prices */}
          <Card className="p-6 border space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Price & Size</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Entry Price" error={errors.entryPrice}>
                <Input type="number" step="0.01" placeholder="0.00" value={form.entryPrice} onChange={e => set('entryPrice', e.target.value)} className={errors.entryPrice ? 'border-red-500' : ''} />
              </Field>
              <Field label="Exit Price" error={errors.exitPrice}>
                <Input type="number" step="0.01" placeholder="0.00" value={form.exitPrice} onChange={e => set('exitPrice', e.target.value)} className={errors.exitPrice ? 'border-red-500' : ''} />
              </Field>
              <Field label="Stop Loss">
                <Input type="number" step="0.01" placeholder="0.00" value={form.stopLoss} onChange={e => set('stopLoss', e.target.value)} />
              </Field>
              <Field label="Take Profit">
                <Input type="number" step="0.01" placeholder="0.00" value={form.takeProfit} onChange={e => set('takeProfit', e.target.value)} />
              </Field>
              <Field label="Position Size" error={errors.positionSize}>
                <Input type="number" step="0.01" placeholder="Contracts / shares" value={form.positionSize} onChange={e => set('positionSize', e.target.value)} className={errors.positionSize ? 'border-red-500' : ''} />
              </Field>
              <Field label="Risk Amount ($)">
                <Input type="number" step="0.01" placeholder="Amount risked" value={form.riskAmount} onChange={e => set('riskAmount', e.target.value)} />
              </Field>
              <Field label="Fees / Commission">
                <Input type="number" step="0.01" placeholder="0.00" value={form.fees} onChange={e => set('fees', e.target.value)} />
              </Field>
              <Field label="Leverage">
                <Input type="number" step="0.1" placeholder="e.g. 20" value={form.leverage} onChange={e => set('leverage', e.target.value)} />
              </Field>
            </div>
            {form.leverage && (
              <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground border-t border-border">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  Leverage: <span className="text-foreground font-medium">{parseFloat(form.leverage)}:1</span>
                </span>
              </div>
            )}
          </Card>

          {/* Setup */}
          <Card className="p-6 border space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Setup & Context</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Strategy / Setup">
                <Input placeholder="e.g. FVG Fill, Breakout" value={form.strategy} onChange={e => set('strategy', e.target.value)} />
              </Field>
              <Field label="Timeframe">
                <Select value={form.timeframe} onValueChange={v => set('timeframe', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['1m','3m','5m','15m','30m','1h','2h','4h','8h','D','W'] as Timeframe[]).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Session">
                <Select value={form.session} onValueChange={v => set('session', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="london">London</SelectItem>
                    <SelectItem value="new_york">New York</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="london_ny_overlap">London/NY Overlap</SelectItem>
                    <SelectItem value="pre_market">Pre-Market</SelectItem>
                    <SelectItem value="after_hours">After Hours</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                      form.tags.includes(tag) ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-border text-muted-foreground hover:border-muted-foreground')}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6 border space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Journal Entry</h2>
            <Field label="Trade Notes">
              <Textarea placeholder="Describe what happened, why you entered, market conditions..." rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </Field>
            <Field label="Lessons Learned">
              <Textarea placeholder="What did you learn from this trade?" rows={3} value={form.lessonsLearned} onChange={e => set('lessonsLearned', e.target.value)} />
            </Field>
            <div>
              <Label className="text-sm font-medium mb-2 block">Mistakes Made</Label>
              <div className="flex flex-wrap gap-2">
                {MISTAKES.map(m => (
                  <button key={m} onClick={() => toggleMistake(m)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                      form.mistakes.includes(m) ? 'bg-red-600/20 border-red-500/40 text-red-400' : 'border-border text-muted-foreground hover:border-muted-foreground')}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          <Card className="p-6 border space-y-5">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Psychology</h2>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Confidence Rating: {form.confidenceRating}/10</Label>
              <Slider min={1} max={10} step={1} value={[form.confidenceRating]} onValueChange={(v) => { const arr = Array.isArray(v) ? v : [v]; set('confidenceRating', arr[0]); }} className="mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>Low</span><span>High</span></div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Emotion Before</Label>
              <Select value={form.emotionBefore} onValueChange={v => set('emotionBefore', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Emotion After</Label>
              <Select value={form.emotionAfter} onValueChange={v => set('emotionAfter', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-6 border space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Symbol</span><span className="font-medium">{form.symbol || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Direction</span>
                <span className={cn('font-medium', form.direction === 'long' ? 'text-emerald-400' : 'text-red-400')}>{form.direction.toUpperCase()}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">P&L</span>
                <span className={cn('font-bold', pnl === null ? '' : pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {pnl === null ? '—' : `${pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">R-Multiple</span><span className="font-medium">{rMultiple === null ? '—' : `${rMultiple}R`}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tags</span><span className="text-right text-xs">{form.tags.length > 0 ? form.tags.slice(0, 3).join(', ') : '—'}</span></div>
            </div>
            <div className="pt-2 space-y-2">
              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-2">
                <Save className="w-4 h-4" /> {submitting ? 'Saving…' : 'Save Trade'}
              </Button>
              <Button variant="outline" onClick={() => router.back()} className="w-full">Cancel</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
