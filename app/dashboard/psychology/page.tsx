'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { PsychologyEntry, EmotionType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { Plus, Brain, Heart, Zap, MessageSquare, Sun, Moon, X } from 'lucide-react';
import { toast } from 'sonner';

const EMOTIONS: EmotionType[] = ['calm', 'confident', 'focused', 'neutral', 'anxious', 'fearful', 'greedy', 'frustrated', 'overconfident', 'revenge'];
const EMOTION_COLOR: Record<string, string> = {
  calm: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  confident: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  focused: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  neutral: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  anxious: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  fearful: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  greedy: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  frustrated: 'text-red-400 bg-red-500/10 border-red-500/20',
  overconfident: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  revenge: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};
const ENTRY_TYPES = [
  { value: 'pre_market', label: 'Pre-Market', icon: Sun },
  { value: 'post_market', label: 'Post-Market', icon: Moon },
  { value: 'mindset', label: 'Mindset', icon: Brain },
  { value: 'emotional', label: 'Emotional', icon: Heart },
  { value: 'confidence', label: 'Confidence', icon: Zap },
  { value: 'reflection', label: 'Reflection', icon: MessageSquare },
];

function generateId() { return `psy-${Date.now()}`; }

export default function PsychologyPage() {
  const { psychologyEntries, savePsychologyEntry } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'pre_market' as PsychologyEntry['type'],
    title: '',
    content: '',
    mood: 'neutral' as EmotionType,
    confidenceLevel: 7,
  });

  const set = (key: string, value: unknown) => setForm(p => ({ ...p, [key]: value }));

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }
    const entry: PsychologyEntry = {
      id: generateId(),
      userId: 'user-1',
      date: form.date,
      type: form.type,
      title: form.title,
      content: form.content,
      mood: form.mood,
      confidenceLevel: form.confidenceLevel,
      createdAt: new Date().toISOString(),
    };
    savePsychologyEntry(entry);
    toast.success('Journal entry saved');
    setShowForm(false);
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), type: 'pre_market', title: '', content: '', mood: 'neutral', confidenceLevel: 7 });
  };

  const filtered = psychologyEntries.filter(e => filterType === 'all' || e.type === filterType);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const ENTRY_ICON: Record<string, React.ElementType> = {
    pre_market: Sun, post_market: Moon, mindset: Brain, emotional: Heart, confidence: Zap, reflection: MessageSquare
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Psychology Journal</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track your mindset, emotions, and mental growth</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
          <Plus className="w-4 h-4" />New Entry
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border border-violet-500/20 bg-violet-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-violet-400">New Journal Entry</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Entry Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTRY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="What's this entry about?" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea placeholder="Write your thoughts, reflections, observations..." rows={5} value={form.content} onChange={e => set('content', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Mood</Label>
              <Select value={form.mood} onValueChange={v => set('mood', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Confidence Level: {form.confidenceLevel}/10</Label>
              <div className="pt-2">
                <Slider min={1} max={10} step={1} value={[form.confidenceLevel]}
                  onValueChange={(v) => { const arr = Array.isArray(v) ? v : [v]; set('confidenceLevel', arr[0]); }} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white">Save Entry</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterType('all')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all', filterType === 'all' ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-border text-muted-foreground hover:border-muted-foreground')}>
          All
        </button>
        {ENTRY_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all', filterType === t.value ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-border text-muted-foreground hover:border-muted-foreground')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <Card className="p-12 border text-center">
            <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No journal entries yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Start tracking your mental state and emotions to identify patterns that affect your trading.</p>
            <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
              <Plus className="w-4 h-4" />Write First Entry
            </Button>
          </Card>
        ) : sorted.map(entry => {
          const Icon = ENTRY_ICON[entry.type] || MessageSquare;
          return (
            <Card key={entry.id} className="p-5 border hover:border-border/80 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{entry.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{format(parseISO(entry.date), 'MMM d, yyyy')}</span>
                        <span className="capitalize">{entry.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.mood && (
                        <Badge variant="outline" className={cn('text-xs border', EMOTION_COLOR[entry.mood] || 'text-muted-foreground')}>
                          {entry.mood}
                        </Badge>
                      )}
                      {entry.confidenceLevel && (
                        <span className="text-xs text-muted-foreground">{entry.confidenceLevel}/10</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{entry.content}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
