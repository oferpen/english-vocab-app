import type { Metadata, Viewport } from 'next';
import { Rubik, Cagliostro } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import AnimatedBackground from '@/components/AnimatedBackground';
import PWAInstaller from '@/components/PWAInstaller';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-rubik',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  preload: true,
});

const cagliostro = Cagliostro({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-cagliostro',
  fallback: ['var(--font-rubik)', 'Rubik', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'EnglishPath - הרפתקת האנגלית שלכם!',
  description: 'לימוד אנגלית לילדים בדרך המהנה ביותר - הצטרפו להרפתקה!',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EnglishPath',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'EnglishPath',
    title: 'EnglishPath - הרפתקת האנגלית שלכם!',
    description: 'לימוד אנגלית לילדים בדרך המהנה ביותר - הצטרפו להרפתקה!',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Enables safe area insets
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${cagliostro.variable}`}>
      <body style={{ margin: 0, padding: 0, fontFamily: rubik.style.fontFamily }} className={rubik.className}>
        <Providers>
          <AnimatedBackground />
          {children}
          <PWAInstaller />
        </Providers>
      </body>
    </html>
  );
}
