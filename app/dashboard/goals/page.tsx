'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { TradingRule } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, ShieldAlert, Target, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

function generateId() { return `rule-${Date.now()}`; }

const TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  daily_loss_limit: { label: 'Daily Loss Limit', color: 'text-red-400', icon: AlertTriangle },
  weekly_loss_limit: { label: 'Weekly Loss Limit', color: 'text-orange-400', icon: AlertTriangle },
  max_trades_per_day: { label: 'Max Trades/Day', color: 'text-amber-400', icon: ShieldAlert },
  risk: { label: 'Risk Management', color: 'text-blue-400', icon: Target },
  checklist: { label: 'Checklist', color: 'text-emerald-400', icon: CheckCircle2 },
  custom: { label: 'Custom Rule', color: 'text-violet-400', icon: ShieldAlert },
};

export default function GoalsPage() {
  const { tradingRules, saveTradingRules, user, stats, trades } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'custom' as TradingRule['type'], title: '', description: '', value: '' });
  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const todayPnl = stats.todayPnl;
  const todayTradeCount = trades.filter(t => t.date === format(new Date(), 'yyyy-MM-dd')).length;

  const dailyLossRule = tradingRules.find(r => r.type === 'daily_loss_limit' && r.active);
  const maxTradesRule = tradingRules.find(r => r.type === 'max_trades_per_day' && r.active);
  const violations = [
    dailyLossRule && dailyLossRule.value && todayPnl < -(dailyLossRule.value) ? `Daily loss limit breached ($${Math.abs(todayPnl).toFixed(0)} / $${dailyLossRule.value})` : null,
    maxTradesRule && maxTradesRule.value && todayTradeCount >= maxTradesRule.value ? `Max trades per day reached (${todayTradeCount} / ${maxTradesRule.value})` : null,
  ].filter(Boolean) as string[];

  const toggleRule = (id: string) => {
    const updated = tradingRules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    saveTradingRules(updated);
  };

  const deleteRule = (id: string) => {
    saveTradingRules(tradingRules.filter(r => r.id !== id));
    toast.success('Rule removed');
  };

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    const rule: TradingRule = {
      id: generateId(),
      userId: user?.id ?? '',
      type: form.type,
      title: form.title,
      description: form.description || undefined,
      value: form.value ? parseFloat(form.value) : undefined,
      active: true,
    };
    saveTradingRules([...tradingRules, rule]);
    toast.success('Rule added');
    setShowForm(false);
    setForm({ type: 'custom', title: '', description: '', value: '' });
  };

  const activeRules = tradingRules.filter(r => r.active);
  const inactiveRules = tradingRules.filter(r => !r.active);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Goals & Rules</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Define your trading rules and track compliance</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
          <Plus className="w-4 h-4" />Add Rule
        </Button>
      </div>

      {/* Violations */}
      {violations.length > 0 && (
        <Card className="p-4 border border-red-500/40 bg-red-500/10">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-red-400">Rule Violations Today</span>
          </div>
          <ul className="space-y-1">
            {violations.map((v, i) => (
              <li key={i} className="text-sm text-red-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />{v}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Today's compliance */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className={cn('p-4 border text-center', todayPnl < 0 && dailyLossRule?.value && Math.abs(todayPnl) > dailyLossRule.value ? 'border-red-500/40 bg-red-500/10' : 'border-border')}>
          <div className="text-xs text-muted-foreground mb-1">Today P&L</div>
          <div className={cn('font-bold', todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {todayPnl >= 0 ? '+' : ''}{todayPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </div>
          {dailyLossRule?.value && <div className="text-xs text-muted-foreground">Limit: ${dailyLossRule.value}</div>}
        </Card>
        <Card className={cn('p-4 border text-center', maxTradesRule?.value && todayTradeCount >= maxTradesRule.value ? 'border-amber-500/40 bg-amber-500/10' : 'border-border')}>
          <div className="text-xs text-muted-foreground mb-1">Trades Today</div>
          <div className="font-bold">{todayTradeCount}</div>
          {maxTradesRule?.value && <div className="text-xs text-muted-foreground">Max: {maxTradesRule.value}</div>}
        </Card>
        <Card className="p-4 border text-center">
          <div className="text-xs text-muted-foreground mb-1">Active Rules</div>
          <div className="font-bold text-emerald-400">{activeRules.length}</div>
        </Card>
        <Card className="p-4 border text-center">
          <div className="text-xs text-muted-foreground mb-1">Violations Today</div>
          <div className={cn('font-bold', violations.length > 0 ? 'text-red-400' : 'text-emerald-400')}>{violations.length}</div>
        </Card>
      </div>

      {/* Add rule form */}
      {showForm && (
        <Card className="p-6 border border-blue-500/20 bg-blue-500/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-blue-400">New Rule</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rule Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Value (optional)</Label>
              <Input type="number" placeholder="e.g. 500 for $500 limit" value={form.value} onChange={e => set('value', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="Rule name" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea placeholder="Explain this rule..." rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white">Add Rule</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Active rules */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Active Rules ({activeRules.length})</h2>
        {activeRules.map(rule => {
          const meta = TYPE_META[rule.type] || TYPE_META.custom;
          const Icon = meta.icon;
          return (
            <Card key={rule.id} className="p-4 border flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted shrink-0">
                <Icon className={cn('w-4 h-4', meta.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{rule.title}</span>
                  {rule.value && <Badge variant="outline" className={cn('text-xs', meta.color)}>{rule.type.includes('loss') ? `-$${rule.value}` : rule.type === 'max_trades_per_day' ? `${rule.value} trades` : rule.type === 'risk' ? `${rule.value}%` : `${rule.value}`}</Badge>}
                </div>
                {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Switch checked={rule.active} onCheckedChange={() => toggleRule(rule.id)} />
                <button onClick={() => deleteRule(rule.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
        {activeRules.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            No active rules. Add rules to enforce trading discipline.
          </div>
        )}
      </div>

      {inactiveRules.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Inactive Rules ({inactiveRules.length})</h2>
          {inactiveRules.map(rule => {
            const meta = TYPE_META[rule.type] || TYPE_META.custom;
            const Icon = meta.icon;
            return (
              <Card key={rule.id} className="p-4 border opacity-50 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm line-through">{rule.title}</span>
                  {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={false} onCheckedChange={() => toggleRule(rule.id)} />
                  <button onClick={() => deleteRule(rule.id)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
