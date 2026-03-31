'use client';

import { use, useState } from 'react';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PnlBadge } from '@/components/pnl-badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft, TrendingUp, TrendingDown, Edit, Trash2, Calendar,
  Clock, Tag, Brain, AlertTriangle, BookOpen, Target, Award
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trades, deleteTrade } = useApp();
  const router = useRouter();
  const trade = trades.find(t => t.id === id);

  if (!trade) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Trade not found</h2>
        <p className="text-muted-foreground mb-6">This trade may have been deleted.</p>
        <Link href="/dashboard/history"><Button variant="outline">Back to History</Button></Link>
      </div>
    );
  }

  const handleDelete = () => {
    deleteTrade(trade.id);
    toast.success('Trade deleted');
    router.push('/dashboard/history');
  };

  const EMOTION_EMOJI: Record<string, string> = {
    calm: '😌', confident: '💪', focused: '🎯', neutral: '😐',
    anxious: '😰', fearful: '😨', greedy: '🤑', frustrated: '😤',
    overconfident: '🦁', revenge: '😡'
  };

  const InfoRow = ({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className={cn('flex items-start justify-between py-2.5 border-b border-border/50 last:border-0', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right ml-4">{value}</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </div>

      {/* Hero card */}
      <Card className={cn('p-6 border', trade.outcome === 'win' ? 'border-emerald-500/20 bg-emerald-500/5' : trade.outcome === 'loss' ? 'border-red-500/20 bg-red-500/5' : 'border-border')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-2xl', trade.outcome === 'win' ? 'bg-emerald-500/15' : trade.outcome === 'loss' ? 'bg-red-500/15' : 'bg-muted')}>
              {trade.direction === 'long'
                ? <TrendingUp className={cn('w-8 h-8', trade.outcome === 'win' ? 'text-emerald-400' : 'text-red-400')} />
                : <TrendingDown className={cn('w-8 h-8', trade.outcome === 'win' ? 'text-emerald-400' : 'text-red-400')} />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">{trade.symbol}</h1>
                <Badge variant="outline" className={cn(trade.direction === 'long' ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30')}>
                  {trade.direction.toUpperCase()}
                </Badge>
                <Badge className={cn(trade.outcome === 'win' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : trade.outcome === 'loss' ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-slate-500/15 text-slate-400 border-slate-500/30')}>
                  {trade.outcome.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(parseISO(trade.date), 'MMMM d, yyyy')}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{trade.time}</span>
                <span>{trade.assetType}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/trade/${trade.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2"><Edit className="w-4 h-4" />Edit</Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" size="sm" className="gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"><Trash2 className="w-4 h-4" />Delete</Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. The trade will be permanently removed from your journal.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">P&L</div>
            <PnlBadge value={trade.pnl} size="lg" />
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">R-Multiple</div>
            <div className={cn('text-xl font-bold', trade.rMultiple !== undefined && trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {trade.rMultiple !== undefined ? `${trade.rMultiple >= 0 ? '+' : ''}${trade.rMultiple}R` : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Entry</div>
            <div className="text-xl font-bold tabular-nums">{trade.entryPrice.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Exit</div>
            <div className="text-xl font-bold tabular-nums">{trade.exitPrice.toFixed(2)}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-blue-400" />Trade Details</h2>
            <InfoRow label="Symbol" value={<span className="font-bold">{trade.symbol}</span>} />
            <InfoRow label="Asset Type" value={trade.assetType} />
            <InfoRow label="Direction" value={
              <span className={trade.direction === 'long' ? 'text-emerald-400' : 'text-red-400'}>{trade.direction.toUpperCase()}</span>
            } />
            <InfoRow label="Entry Price" value={<span className="tabular-nums">{trade.entryPrice.toFixed(4)}</span>} />
            <InfoRow label="Exit Price" value={<span className="tabular-nums">{trade.exitPrice.toFixed(4)}</span>} />
            {trade.stopLoss && <InfoRow label="Stop Loss" value={<span className="tabular-nums text-red-400">{trade.stopLoss.toFixed(4)}</span>} />}
            {trade.takeProfit && <InfoRow label="Take Profit" value={<span className="tabular-nums text-emerald-400">{trade.takeProfit.toFixed(4)}</span>} />}
            <InfoRow label="Position Size" value={trade.positionSize} />
            {trade.riskAmount && <InfoRow label="Risk Amount" value={`$${trade.riskAmount.toFixed(2)}`} />}
            {trade.fees !== undefined && <InfoRow label="Fees" value={`$${trade.fees.toFixed(2)}`} />}
            <InfoRow label="Strategy" value={trade.strategy || trade.setup || '—'} />
            <InfoRow label="Timeframe" value={trade.timeframe || '—'} />
            <InfoRow label="Session" value={trade.session?.replace('_', ' ') || '—'} />
          </Card>

          {/* Tags */}
          {trade.tags && trade.tags.length > 0 && (
            <Card className="p-6 border">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-blue-400" />Tags</h2>
              <div className="flex flex-wrap gap-2">
                {trade.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">{tag}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          {trade.notes && (
            <Card className="p-6 border">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-400" />Trade Notes</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{trade.notes}</p>
            </Card>
          )}

          {/* Lessons */}
          {trade.lessonsLearned && (
            <Card className="p-6 border border-amber-500/20 bg-amber-500/5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" />Lessons Learned</h2>
              <p className="text-sm text-amber-200/80 leading-relaxed">{trade.lessonsLearned}</p>
            </Card>
          )}

          {/* Mistakes */}
          {trade.mistakes && trade.mistakes.length > 0 && (
            <Card className="p-6 border border-red-500/20 bg-red-500/5">
              <h2 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" />Mistakes Made</h2>
              <ul className="space-y-1">
                {trade.mistakes.map(m => (
                  <li key={m} className="flex items-center gap-2 text-sm text-red-300/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Psychology panel */}
        <div className="space-y-4">
          <Card className="p-6 border">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-violet-400" />Psychology</h2>
            {trade.confidenceRating !== undefined && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">{trade.confidenceRating}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(trade.confidenceRating / 10) * 100}%` }} />
                </div>
              </div>
            )}
            {trade.emotionBefore && (
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Before trade</span>
                <span className="text-sm font-medium">{EMOTION_EMOJI[trade.emotionBefore] || ''} {trade.emotionBefore}</span>
              </div>
            )}
            {trade.emotionAfter && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">After trade</span>
                <span className="text-sm font-medium">{EMOTION_EMOJI[trade.emotionAfter] || ''} {trade.emotionAfter}</span>
              </div>
            )}
          </Card>

          <Card className="p-6 border">
            <h2 className="font-semibold mb-4">Performance</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Gross P&L</span>
                <PnlBadge value={trade.pnl + (trade.fees || 0)} size="sm" />
              </div>
              {trade.fees !== undefined && trade.fees > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fees</span>
                  <span className="text-sm text-red-400">-${trade.fees.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-sm font-medium">Net P&L</span>
                <PnlBadge value={trade.pnl} size="sm" />
              </div>
              {trade.riskAmount && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Risk Amount</span>
                  <span className="text-sm">${trade.riskAmount.toFixed(2)}</span>
                </div>
              )}
              {trade.rMultiple !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">R-Multiple</span>
                  <span className={cn('text-sm font-bold', trade.rMultiple >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
