import type { Metadata, Viewport } from 'next';
import { Rubik, Cagliostro } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import AnimatedBackground from '@/components/AnimatedBackground';
import PWAInstaller from '@/components/PWAInstaller';
// Temporarily disabled to debug production issue
// import SentryProvider from '@/components/SentryProvider';

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
  preload: false, // Don't preload - only used for headings, not critical for initial render
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
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
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
  // Build-time version - changes with each deploy
  const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'v4-20260203';

  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${cagliostro.variable}`}>
      <head>
        {/* Critical: Cache control meta tags for mobile browsers */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Critical: Run cache clearing IMMEDIATELY in head before anything loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';
                if (typeof window === 'undefined') return;
                
                var APP_VERSION = '${APP_VERSION}';
                var storedVersion = sessionStorage.getItem('app-version');
                
                // If version mismatch or first visit, clear everything and reload
                if (!storedVersion || storedVersion !== APP_VERSION) {
                  try {
                    // Unregister ALL service workers immediately
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for (var i = 0; i < registrations.length; i++) {
                          registrations[i].unregister();
                        }
                      });
                    }
                    
                    // Delete ALL caches immediately
                    if ('caches' in window) {
                      caches.keys().then(function(cacheNames) {
                        for (var i = 0; i < cacheNames.length; i++) {
                          caches.delete(cacheNames[i]);
                        }
                      });
                    }
                    
                    // Clear all storage
                    try {
                      sessionStorage.clear();
                      localStorage.clear();
                    } catch(e) {}
                    
                    // Set new version and reload with cache busting
                    sessionStorage.setItem('app-version', APP_VERSION);
                    var url = window.location.href.split('?')[0] + '?_cb=' + Date.now();
                    window.location.replace(url);
                  } catch(e) {
                    console.error('Cache clear error:', e);
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: rubik.style.fontFamily }} className={rubik.className}>
        {/* Temporarily disabled SentryProvider to debug production issue */}
        {/* <SentryProvider /> */}
        <Providers>
          <AnimatedBackground />
          {children}
          <PWAInstaller />
        </Providers>
        {/* Suppress browser extension message errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('message channel closed')) {
                    e.preventDefault();
                    return false;
                  }
                });
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && e.reason.message.includes('message channel closed')) {
                    e.preventDefault();
                    return false;
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
