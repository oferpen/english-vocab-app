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
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${cagliostro.variable}`}>
      <body style={{ margin: 0, padding: 0, fontFamily: rubik.style.fontFamily }} className={rubik.className}>
        {/* Temporarily disabled SentryProvider to debug production issue */}
        {/* <SentryProvider /> */}
        <Providers>
          <AnimatedBackground />
          {children}
          <PWAInstaller />
        </Providers>
        {/* Aggressive cache clearing and service worker cleanup */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                
                // Immediately unregister all service workers
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                      registration.unregister().then(function() {
                        console.log('Service Worker unregistered');
                      }).catch(function(err) {
                        console.log('Error unregistering service worker:', err);
                      });
                    });
                  }).catch(function(err) {
                    console.log('Error getting service worker registrations:', err);
                  });
                }
                
                // Clear all caches
                if ('caches' in window) {
                  caches.keys().then(function(cacheNames) {
                    cacheNames.forEach(function(cacheName) {
                      caches.delete(cacheName).then(function() {
                        console.log('Cache deleted:', cacheName);
                      }).catch(function(err) {
                        console.log('Error deleting cache:', err);
                      });
                    });
                  }).catch(function(err) {
                    console.log('Error getting cache keys:', err);
                  });
                }
                
                // Suppress browser extension message errors
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
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
