'use client';

import { useEffect, useState, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Loader2 } from 'lucide-react';

interface WalletData {
  n: string;
  d: string;
  p: string;
  f: string;
  t: string;
  e: number;
}

export default function WalletPage({ params }: { params: Promise<{ data: string }> }) {
  const { data } = use(params);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(data));
      setTimeout(() => setWalletData(decoded), 0);
      setTimeout(() => setIsExpired(Date.now() > decoded.e), 0);
    } catch {
      setTimeout(() => setError('Invalid wallet data'), 0);
    }
  }, [data]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <p className="text-lg font-medium">Invalid Wallet</p>
              <p className="text-gray-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Clock className="h-12 w-12 text-gray-400" />
              <p className="text-lg font-medium">Wallet Expired</p>
              <p className="text-gray-500">
                This patient wallet has expired. Please request a new QR code.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-lg text-muted-foreground">Loading your wallet...</p>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
            <span className="text-2xl">🏥</span>
          </div>
          <CardTitle>Patient Health Summary</CardTitle>
          <p className="text-sm text-gray-500">Clearwater Ridge Community Health</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="text-lg font-semibold">{walletData.n}</h3>
            <div className="mt-2 flex gap-2">
              <Badge className={priorityColors[walletData.p] || 'bg-gray-100'}>
                {walletData.p} priority
              </Badge>
              <Badge variant="outline">{walletData.t}</Badge>
            </div>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-500">Referred To</h4>
            <p>{walletData.f}</p>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-500">Diagnosis</h4>
            <p>{walletData.d}</p>
          </div>

          <div className="border-t pt-4 text-center text-xs text-gray-400">
            <p>This is a read-only patient summary.</p>
            <p>Valid until: {new Date(walletData.e).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
