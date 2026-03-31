'use client';

import { useState } from 'react';
import { Sidebar, MobileSidebar } from '@/components/sidebar';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <MobileSidebar />
      <main className={cn('flex-1 overflow-y-auto scrollbar-thin', 'lg:ml-0')}>
        <div className="min-h-full p-4 lg:p-6 lg:pl-6">
          {children}
        </div>
      </main>
    </div>
  );
}
