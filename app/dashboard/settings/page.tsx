'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User, Bell, Shield, Palette, DollarSign, Save, Sparkles, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const AI_KEY_STORAGE = 'tj_openai_key';

export default function SettingsPage() {
  const { settings, saveSettings } = useApp();
  const [form, setForm] = useState({ ...settings });
  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const setNotif = (k: string, v: boolean) => setForm(p => ({ ...p, notifications: { ...p.notifications, [k]: v } }));
  const [aiKey, setAiKey] = useState(() => { try { return localStorage.getItem(AI_KEY_STORAGE) || ''; } catch { return ''; } });
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    saveSettings(form);
    if (aiKey.trim()) localStorage.setItem(AI_KEY_STORAGE, aiKey.trim());
    else localStorage.removeItem(AI_KEY_STORAGE);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="p-6 border space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-blue-400" />
          <h2 className="font-semibold">Profile</h2>
        </div>
        <Separator />
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-blue-600 text-white text-xl font-bold">
              {form.displayName.split(' ').map((n: string) => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{form.displayName}</div>
            <div className="text-sm text-muted-foreground">{form.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input value={form.displayName} onChange={e => set('displayName', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Trading Settings */}
      <Card className="p-6 border space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold">Trading Settings</h2>
        </div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Account Currency</Label>
            <Select value={form.currency} onValueChange={v => set('currency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
                <SelectItem value="GBP">GBP — British Pound</SelectItem>
                <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Account Size ($)</Label>
            <Input type="number" value={form.defaultAccountSize} onChange={e => set('defaultAccountSize', parseFloat(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Default Risk Per Trade (%)</Label>
            <Input type="number" step="0.1" value={form.riskPerTrade} onChange={e => set('riskPerTrade', parseFloat(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={form.timezone} onValueChange={v => set('timezone', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Central European (CET)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 border space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold">Appearance</h2>
        </div>
        <Separator />
        <div className="space-y-1.5">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {(['dark', 'light', 'system'] as const).map(t => (
              <button key={t} onClick={() => set('theme', t)}
                className={cn('flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all',
                  form.theme === t ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-border text-muted-foreground hover:border-muted-foreground')}>
                <div className={cn('w-full h-10 rounded-lg', t === 'dark' ? 'bg-slate-900 border border-slate-700' : t === 'light' ? 'bg-white border border-slate-200' : 'bg-gradient-to-r from-slate-900 to-white border border-slate-400')} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 border space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <Separator />
        <div className="space-y-4">
          {[
            { key: 'dailyReminder', label: 'Daily Trade Reminder', desc: 'Remind you to journal today\'s trades at end of session' },
            { key: 'weeklyReview', label: 'Weekly Review Reminder', desc: 'Remind you to write your weekly review every Friday' },
            { key: 'missedJournaling', label: 'Missed Journaling Alert', desc: 'Alert when you\'ve traded but haven\'t journaled' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
              <Switch
                checked={form.notifications[key as keyof typeof form.notifications]}
                onCheckedChange={v => setNotif(key, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* AI Integration */}
      <Card className="p-6 border space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold">AI Integration</h2>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>OpenAI API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={aiKey}
                onChange={e => setAiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for AI Trade Review. Stored locally, never shared. Get a key at{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
                platform.openai.com
              </a>
              . Requires GPT-4o access.
            </p>
          </div>
          {aiKey && (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              API key configured — AI Review is enabled
            </div>
          )}
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border border-red-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          <h2 className="font-semibold text-red-400">Danger Zone</h2>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Clear All Data</div>
            <div className="text-xs text-muted-foreground">Permanently delete all trades, journal entries, and rules</div>
          </div>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => {
            ['tj_trades','tj_daily_notes','tj_weekly_reviews','tj_rules','tj_psychology','tj_settings','tj_initialized','tj_version'].forEach(k => localStorage.removeItem(k));
            window.location.reload();
          }}>Clear All Data</Button>
        </div>
      </Card>

      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-8">
          <Save className="w-4 h-4" />Save Settings
        </Button>
      </div>
    </div>
  );
}
