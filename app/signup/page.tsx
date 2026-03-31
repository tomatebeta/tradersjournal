'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TrendingUp, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const PERKS = [
  'Visual P&L calendar with daily breakdown',
  'Deep analytics — setups, sessions, emotions',
  'Psychology journal and mindset tracking',
  'Goals & rules engine with violation alerts',
  'Weekly review templates',
  'CSV export & printable reports',
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    toast.success('Account created! Welcome to TradeJournal Pro.');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left — perks */}
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white">TradeJournal<span className="text-blue-400"> Pro</span></span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">Everything serious traders need to improve</h2>
          <p className="text-slate-400 mb-8">Your free account includes all core features. No trial limits, no credit card required.</p>
          <ul className="space-y-4">
            {PERKS.map(p => (
              <li key={p} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />{p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div>
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <Card className="p-8 bg-[#0d1424] border border-white/8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
            <p className="text-slate-400 text-sm mb-6">Start journaling your trades for free</p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Full Name</Label>
                <Input
                  placeholder="Alex Morgan"
                  value={name} onChange={e => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500 pr-10"
                    onKeyDown={e => e.key === 'Enter' && handleSignup()}
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button onClick={handleSignup} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-5">
                {loading ? 'Creating account...' : 'Create Free Account'}
              </Button>
            </div>

            <p className="text-xs text-slate-600 mt-4 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
