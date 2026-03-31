'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, TrendingUp, Calendar, History, BarChart3,
  BookOpen, Brain, Target, Settings, ChevronLeft, ChevronRight,
  Plus, Bell, LogOut, Sun, Moon, Menu, X, FileText, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/add-trade', label: 'Add Trade', icon: Plus, highlight: true },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/history', label: 'Trade History', icon: History },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/reviews', label: 'Reviews', icon: FileText },
  { href: '/dashboard/psychology', label: 'Psychology', icon: Brain },
  { href: '/dashboard/goals', label: 'Goals & Rules', icon: Target },
  { href: '/dashboard/ai-review', label: 'AI Review', icon: Sparkles },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { settings, stats } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0 relative z-40',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-bold text-sm text-sidebar-foreground">TradeJournal</span>
            <span className="font-bold text-sm text-blue-500"> Pro</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn('ml-auto p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors', collapsed && 'ml-0')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
                  : item.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed ? 'justify-center' : ''
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {/* Stats pill */}
        {!collapsed && (
          <div className="bg-sidebar-accent rounded-lg p-3 mb-2">
            <div className="text-xs text-sidebar-foreground/50 mb-1">Total P&L</div>
            <div className={cn('text-base font-bold', stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
            <div className="text-xs text-sidebar-foreground/50">{stats.totalTrades} trades · {stats.winRate}% win rate</div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn('flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent text-sm transition-colors', collapsed ? 'justify-center' : '')}
          title={collapsed ? 'Toggle theme' : undefined}
        >
          {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />) : <Sun className="w-4 h-4 shrink-0 opacity-0" />}
          {!collapsed && <span>Toggle theme</span>}
        </button>

        {/* User */}
        <div className={cn('flex items-center gap-3 px-3 py-2 rounded-lg', collapsed ? 'justify-center' : '')}>
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {settings.displayName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">{settings.displayName}</div>
              <div className="text-xs text-sidebar-foreground/50 truncate">{settings.email}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { settings, stats } = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
            <div className="flex items-center h-16 px-4 border-b border-sidebar-border gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm">TradeJournal</span>
                <span className="font-bold text-sm text-blue-500"> Pro</span>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto p-1 rounded-md hover:bg-sidebar-accent">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive ? 'bg-blue-600/15 text-blue-400 border border-blue-600/20'
                        : item.highlight ? 'bg-blue-600 text-white hover:bg-blue-500'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground')}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
