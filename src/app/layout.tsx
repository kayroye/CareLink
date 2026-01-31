import type { Metadata } from 'next';
import { Merriweather, Source_Sans_3 } from 'next/font/google';
import './globals.css';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/theme';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/sonner';

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-merriweather',
  display: 'swap',
});

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-source-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CareLink - Offline-First Patient Referral Tracking',
  description: 'Track and manage patient referrals even when offline',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${merriweather.variable} ${sourceSans3.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <NetworkProvider>
              <AppShell>
                {children}
              </AppShell>
              <Toaster />
            </NetworkProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
