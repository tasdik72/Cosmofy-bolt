import type { Metadata, Viewport } from 'next';
import { Roboto, Open_Sans } from 'next/font/google';
import './globals.css';
import { AppLayout } from '@/components/layout/app-layout';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { SpeedInsights } from '@vercel/speed-insights/next';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Cosmofy - Your Universe, Unveiled',
  description: 'Explore real-time space weather, track spacecraft, discover celestial events, and get AI-powered explanations of cosmic phenomena.',
  icons: {
    icon: [
      { url: '/img/logo/favicon.svg', type: 'image/svg+xml' },
      { url: '/img/logo/favicon.ico', sizes: 'any' }
    ],
    apple: '/img/logo/apple-touch-icon.png',
    other: [
      {
        rel: 'mask-icon',
        url: '/img/logo/safari-pinned-tab.svg',
        color: '#000000'
      }
    ]
  },
  manifest: '/img/logo/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cosmofy'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${openSans.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
