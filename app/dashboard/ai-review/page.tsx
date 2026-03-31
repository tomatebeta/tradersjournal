'use client';

import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/lib/context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  Sparkles, Upload, X, ImageIcon, Loader2, Copy, Check,
  TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import { Trade } from '@/lib/types';

const AI_KEY_STORAGE = 'tj_openai_key';

function getStoredKey(): string {
  try { return localStorage.getItem(AI_KEY_STORAGE) || ''; } catch { return ''; }
}

function formatTradeForAI(trade: Trade): string {
  const lines = [
    `Symbol: ${trade.symbol}`,
    `Direction: ${trade.direction.toUpperCase()}`,
    `Asset Type: ${trade.assetType}`,
    `Date: ${trade.date} at ${trade.time}`,
    `Entry Price: $${trade.entryPrice}`,
    `Exit Price: $${trade.exitPrice}`,
    trade.stopLoss ? `Stop Loss: $${trade.stopLoss}` : null,
    trade.takeProfit ? `Take Profit: $${trade.takeProfit}` : null,
    `Position Size: ${trade.positionSize}`,
    trade.riskAmount ? `Risk Amount: $${trade.riskAmount}` : null,
    `P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl}`,
    trade.rMultiple !== undefined ? `R-Multiple: ${trade.rMultiple}R` : null,
    `Outcome: ${trade.outcome.toUpperCase()}`,
    trade.strategy ? `Strategy/Setup: ${trade.strategy}` : null,
    trade.timeframe ? `Timeframe: ${trade.timeframe}` : null,
    trade.session ? `Session: ${trade.session}` : null,
    trade.confidenceRating ? `Confidence Before Trade: ${trade.confidenceRating}/10` : null,
    trade.emotionBefore ? `Emotion Before: ${trade.emotionBefore}` : null,
    trade.emotionAfter ? `Emotion After: ${trade.emotionAfter}` : null,
    trade.tags?.length ? `Tags: ${trade.tags.join(', ')}` : null,
    trade.mistakes?.length ? `Mistakes Noted: ${trade.mistakes.join(', ')}` : null,
    trade.notes ? `Trader Notes: ${trade.notes}` : null,
    trade.lessonsLearned ? `Lessons Learned: ${trade.lessonsLearned}` : null,
  ];
  return lines.filter(Boolean).join('\n');
}

function ReviewSection({ title, content }: { title: string; content: string }) {
  const [open, setOpen] = useState(true);
  const colorMap: Record<string, string> = {
    'Setup Quality': 'text-blue-400',
    'Entry Analysis': 'text-violet-400',
    'Exit Analysis': 'text-cyan-400',
    'Risk Management': 'text-amber-400',
    'Psychology & Discipline': 'text-pink-400',
    'Key Lessons': 'text-emerald-400',
    'Overall Grade': 'text-white',
  };
  const color = colorMap[title] || 'text-blue-400';

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <span className={cn('text-sm font-semibold', color)}>{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-t border-border">
          {content}
        </div>
      )}
    </div>
  );
}

function parseReview(raw: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const lines = raw.split('\n');
  let current: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)/);
    if (headerMatch) {
      if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() });
      current = { title: headerMatch[1].trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push({ title: current.title, content: current.lines.join('\n').trim() });
  return sections.length > 0 ? sections : [{ title: 'AI Review', content: raw }];
}

export default function AIReviewPage() {
  const { trades } = useApp();
  const [selectedTradeId, setSelectedTradeId] = useState<string>('none');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<{ file: File; base64: string; preview: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(getStoredKey);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const selectedTrade = trades.find(t => t.id === selectedTradeId);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files are supported'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10 MB'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      setImage({ file, base64, preview: base64 });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!prompt.trim() && !image) {
      toast.error('Add a trade description or chart image');
      return;
    }
    const key = apiKey.trim();
    if (!key) {
      setShowKeyInput(true);
      toast.error('Enter your OpenAI API key first');
      return;
    }

    localStorage.setItem(AI_KEY_STORAGE, key);
    setLoading(true);
    setReview(null);

    try {
      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim() || undefined,
          imageBase64: image?.base64 || undefined,
          tradeData: selectedTrade ? formatTradeForAI(selectedTrade) : undefined,
          apiKey: key,
        }),
      });

      const data = await res.json() as { review?: string; error?: string };
      if (!res.ok || data.error) {
        toast.error(data.error || 'Analysis failed');
        return;
      }
      setReview(data.review ?? null);
    } catch {
      toast.error('Network error — check your connection');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!review) return;
    navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = review ? parseReview(review) : [];
  const sortedTrades = [...trades].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI Trade Review</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Get expert AI feedback on your trade — attach a chart screenshot and/or describe what happened</p>
        </div>
        <button
          onClick={() => setShowKeyInput(v => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          {apiKey ? '✓ API key set' : 'Set API key'}
        </button>
      </div>

      {/* API Key input */}
      {showKeyInput && (
        <Card className="p-4 border border-violet-500/20 bg-violet-500/5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">OpenAI API Key</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your key is stored locally and never sent anywhere except directly to OpenAI.
            Get one at <span className="text-blue-400">platform.openai.com</span>. Requires GPT-4o access.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 font-mono"
            />
            <Button
              size="sm"
              onClick={() => {
                if (apiKey.trim()) {
                  localStorage.setItem(AI_KEY_STORAGE, apiKey.trim());
                  setShowKeyInput(false);
                  toast.success('API key saved');
                }
              }}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              Save
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — inputs */}
        <div className="lg:col-span-3 space-y-4">
          {/* Trade selector */}
          <Card className="p-5 border space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Trade from Journal (optional)</h2>
            <Select value={selectedTradeId} onValueChange={v => { if (v !== null) setSelectedTradeId(v); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a logged trade to include its data…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No trade selected</SelectItem>
                {sortedTrades.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.symbol} {t.direction.toUpperCase()} · {format(parseISO(t.date), 'MMM d')} ·{' '}
                    <span className={t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {t.pnl >= 0 ? '+' : ''}${t.pnl}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTrade && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 text-sm">
                {selectedTrade.direction === 'long'
                  ? <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                  : <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />}
                <span className="font-semibold">{selectedTrade.symbol}</span>
                <Badge variant="outline" className={cn('text-xs', selectedTrade.outcome === 'win' ? 'text-emerald-400 border-emerald-500/30' : selectedTrade.outcome === 'loss' ? 'text-red-400 border-red-500/30' : '')}>
                  {selectedTrade.outcome.toUpperCase()}
                </Badge>
                <span className={cn('ml-auto font-bold text-sm', selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl}
                </span>
              </div>
            )}
          </Card>

          {/* Description */}
          <Card className="p-5 border space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Describe Your Trade</h2>
            <Textarea
              placeholder="Explain your reasoning: why you entered, what you saw on the chart, how you managed the trade, why you exited, what you think went right or wrong…"
              rows={6}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{prompt.length} characters · more detail = better feedback</p>
          </Card>

          {/* Image upload */}
          <Card className="p-5 border space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Chart Screenshot (optional)</h2>
            {image ? (
              <div className="relative">
                <img src={image.preview} alt="Chart" className="w-full rounded-lg border border-border object-contain max-h-64" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="mt-2 text-xs text-muted-foreground">{image.file.name} · {(image.file.size / 1024).toFixed(0)} KB</div>
              </div>
            ) : (
              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3 group-hover:text-violet-400 transition-colors" />
                <p className="text-sm text-muted-foreground">Drop your chart here or <span className="text-violet-400">browse</span></p>
                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP · max 10 MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            )}
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-3 gap-2 shadow-lg shadow-violet-600/20"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing trade…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Analyze with AI</>
            )}
          </Button>
        </div>

        {/* Right — tips or result */}
        <div className="lg:col-span-2 space-y-4">
          {!review && !loading && (
            <Card className="p-5 border space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold">Tips for better reviews</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                {[
                  'Select the trade from your journal so the AI has all your numbers',
                  'Attach a screenshot of the chart at your entry timeframe',
                  'Describe WHY you took the trade — not just what happened',
                  'Mention your emotional state and any hesitations',
                  'Include what you think you did wrong — the AI can validate or challenge it',
                ].map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {loading && (
            <Card className="p-8 border flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Analyzing your trade…</p>
                <p className="text-xs text-muted-foreground mt-1">This takes 10–20 seconds</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Review result */}
      {review && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="font-semibold">AI Analysis</h2>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 text-xs">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
          </div>

          <div className="space-y-3">
            {sections.map((s, i) => (
              <ReviewSection key={i} title={s.title} content={s.content} />
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => { setReview(null); setPrompt(''); setImage(null); setSelectedTradeId('none'); }}
            className="w-full"
          >
            Start New Review
          </Button>
        </div>
      )}
    </div>
  );
}
