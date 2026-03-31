import Link from 'next/link';
import {
  TrendingUp, BarChart3, Calendar, Brain, Target, Shield,
  ArrowRight, CheckCircle, Star, Zap, ChevronRight, Activity,
  BookOpen, LineChart
} from 'lucide-react';

const FEATURES = [
  { icon: Calendar, title: 'Visual P&L Calendar', desc: 'See your daily profit and loss at a glance. Green days, red days — instantly understand your trading rhythm.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Win rate by setup, performance by session, R-multiple distribution, drawdown charts, and emotion correlation.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: BookOpen, title: 'Rich Trade Journal', desc: 'Log every trade with entry/exit, screenshots, tags, emotions, mistakes, and lessons learned.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: Brain, title: 'Psychology Tracking', desc: 'Track your mental state, confidence levels, and emotional patterns. Understand how psychology impacts performance.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Target, title: 'Goals & Rules Engine', desc: 'Set daily loss limits, max trades per day, and custom rules. Get warned when you break your own discipline.', color: 'text-red-400', bg: 'bg-red-500/10' },
  { icon: Activity, title: 'Weekly Reviews', desc: 'Structured weekly and monthly reviews to reflect on what worked, what didn\'t, and set goals for growth.', color: 'text-sky-400', bg: 'bg-sky-500/10' },
];

const STATS = [
  { value: '10,000+', label: 'Active traders' },
  { value: '$2.4M+', label: 'P&L tracked daily' },
  { value: '1.2M+', label: 'Trades logged' },
  { value: '4.9★', label: 'Average rating' },
];

const TESTIMONIALS = [
  { name: 'Marcus T.', role: 'Futures Trader · 4 years', quote: 'The calendar view alone is worth it. I can see exactly which days I overtrade and which sessions are my sweet spot.', stars: 5 },
  { name: 'Priya K.', role: 'Forex Trader · 6 years', quote: 'TradeJournal Pro helped me realize my Friday trades were consistently losing. I cut those and my win rate jumped 12%.', stars: 5 },
  { name: 'James W.', role: 'Options Trader · 2 years', quote: 'The psychology section is genuinely useful. Seeing that I trade worse when "overconfident" was a game-changer.', stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060b18] text-slate-100">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#060b18]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">TradeJournal<span className="text-blue-400"> Pro</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#analytics" className="hover:text-white transition-colors">Analytics</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors hidden sm:block">Sign in</Link>
            <Link href="/dashboard" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Try Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-xs font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Built for serious traders — not hobbyists
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Your edge lives in
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400"> your data</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            TradeJournal Pro is the professional trading journal that shows you exactly why you win and why you lose —
            with a visual P&L calendar, deep analytics, and psychology tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 text-base">
              Start Journaling Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium px-8 py-4 rounded-xl transition-all text-base">
              Sign In <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-slate-500">
            {['No credit card', 'Free forever', 'Export anytime'].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 px-6 border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Calendar preview */}
      <section id="analytics" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-4">Calendar View</div>
            <h2 className="text-4xl font-bold mb-4">See your P&L at a glance</h2>
            <p className="text-slate-400 max-w-xl mx-auto">One look at the calendar and you know exactly which days were profitable, which were disasters, and which patterns need to change.</p>
          </div>

          {/* Calendar mock */}
          <div className="bg-[#0d1424] border border-white/8 rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">March 2025</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/50" />Profit</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/50" />Loss</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {[
                null, null, null, null, null, { d: 1, pnl: null }, { d: 2, pnl: null },
                { d: 3, pnl: 1240 }, { d: 4, pnl: -380 }, { d: 5, pnl: 2100 }, { d: 6, pnl: 890 }, { d: 7, pnl: -210 }, { d: 8, pnl: null }, { d: 9, pnl: null },
                { d: 10, pnl: -720 }, { d: 11, pnl: 3400 }, { d: 12, pnl: 180 }, { d: 13, pnl: 1650 }, { d: 14, pnl: -440 }, { d: 15, pnl: null }, { d: 16, pnl: null },
                { d: 17, pnl: 2870 }, { d: 18, pnl: 640 }, { d: 19, pnl: -190 }, { d: 20, pnl: 1100 }, { d: 21, pnl: 560 }, { d: 22, pnl: null }, { d: 23, pnl: null },
                { d: 24, pnl: -830 }, { d: 25, pnl: 420 }, { d: 26, pnl: 1780 }, { d: 27, pnl: 2240 }, { d: 28, pnl: 380 }, { d: 29, pnl: null }, { d: 30, pnl: null },
                { d: 31, pnl: 1490 }, null, null, null, null, null, null,
              ].map((day, i) => (
                <div key={i} className={`min-h-[64px] p-2 rounded-lg text-xs ${!day ? 'opacity-0' : day.pnl === null ? 'bg-white/3 border border-white/5' : day.pnl > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  {day && (
                    <>
                      <div className="text-slate-400 mb-1">{day.d}</div>
                      {day.pnl !== null && (
                        <div className={`font-bold ${day.pnl > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {day.pnl > 0 ? '+$' : '-$'}{Math.abs(day.pnl).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-white/1">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-blue-400 text-sm font-medium uppercase tracking-widest mb-4">Everything You Need</div>
            <h2 className="text-4xl font-bold mb-4">Built for the serious trader</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every feature is designed around one goal: help you understand your trading and make better decisions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-[#0d1424] border border-white/6 rounded-2xl p-6 hover:border-white/12 transition-all group">
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by real traders</h2>
            <p className="text-slate-400">Join thousands of traders who use TradeJournal Pro to level up their performance.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-[#0d1424] border border-white/6 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-3xl p-12">
            <h2 className="text-4xl font-bold mb-4">Stop guessing. Start knowing.</h2>
            <p className="text-slate-400 mb-8">Your trading data has the answers. TradeJournal Pro helps you find them.</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 text-base">
              Open Your Journal <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">TradeJournal<span className="text-blue-400"> Pro</span></span>
          </div>
          <div className="text-xs text-slate-600">© 2025 TradeJournal Pro. Built for serious traders.</div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
