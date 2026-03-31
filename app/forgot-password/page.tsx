'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TrendingUp, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dashboard/settings`,
      });
      if (error) { toast.error(error.message); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b18] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-white">Traders<span className="text-blue-400">Journal</span></span>
        </div>
        <Card className="p-8 bg-[#0d1424] border border-white/8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">Check your inbox</h1>
              <p className="text-slate-400 text-sm mb-6">We sent a password reset link to <span className="text-white">{email}</span></p>
              <Link href="/login"><Button variant="outline" className="w-full">Back to Sign In</Button></Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Reset password</h1>
              <p className="text-slate-400 text-sm mb-6">Enter your email and we'll send you a reset link</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Email address</Label>
                  <Input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500"
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                </div>
                <Button onClick={handleSubmit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-5">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
