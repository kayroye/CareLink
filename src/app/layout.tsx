import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReferralLoop - Offline-First Patient Referral Tracking',
  description: 'Track and manage patient referrals even when offline',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NetworkProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pb-20">{children}</main>
            <BottomNav />
          </div>
        </NetworkProvider>
      </body>
    </html>
  );
}
