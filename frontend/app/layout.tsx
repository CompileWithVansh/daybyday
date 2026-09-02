import type { Metadata, Viewport } from 'next';
import { Dancing_Script } from 'next/font/google';
import './globals.css';
import NotificationManager from '@/components/NotificationManager';
import PwaRegister from '@/components/PwaRegister';

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-cursive',
});

export const metadata: Metadata = {
  title: 'DayByDay - Couple Countdown',
  description: 'A private couple app for counting down the days until you meet again',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DayByDay',
  },
  icons: {
    icon: [
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },

};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ec4899',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen ${dancingScript.variable}`}>
        <NotificationManager />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

