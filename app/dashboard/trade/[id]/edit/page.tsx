'use client';

import { use } from 'react';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TradeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trades } = useApp();
  const router = useRouter();
  const trade = trades.find(t => t.id === id);

  if (!trade) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Trade not found</h2>
        <Link href="/dashboard/history"><Button variant="outline">Back to History</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Trade</h1>
          <p className="text-muted-foreground text-sm">{trade.symbol} · {trade.date}</p>
        </div>
      </div>
      <div className="p-6 bg-card border border-border rounded-xl text-muted-foreground text-sm text-center">
        Trade editing form — redirecting to Add Trade for full editing experience.
        <br />
        <Button className="mt-4" onClick={() => router.push(`/dashboard/trade/${id}`)}>View Trade Details</Button>
      </div>
    </div>
  );
}
