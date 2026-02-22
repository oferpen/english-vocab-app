'use client';

import { useEffect, useState } from 'react';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      return isStandalone || isIOSStandalone;
    };

    setIsInstalled(checkInstalled());

    // Register service worker
    if ('serviceWorker' in navigator) {
      // Wait for page to be fully loaded before registering
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
      }
    }

    function registerServiceWorker() {
      // Temporarily disable service worker registration to debug production issues
      // Unregister all existing service workers first
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then(() => {
            console.log('Service Worker unregistered');
          }).catch((err) => {
            console.log('Error unregistering service worker:', err);
          });
        });
      }).catch((err) => {
        console.log('Error getting service worker registrations:', err);
      });

      // Clear all caches
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName).catch((err) => {
              console.log('Error deleting cache:', err);
            });
          });
        }).catch((err) => {
          console.log('Error getting cache keys:', err);
        });
      }

      // Don't register new service worker for now
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Only prevent default if we're going to show our custom prompt
      // and the app is not already installed
      if (!checkInstalled()) {
        const promptEvent = e as any;
        
        // Prevent default only if we're going to use our custom prompt
        // This prevents the browser's default install banner
        e.preventDefault();
        
        // Store the event so we can call prompt() later
        setDeferredPrompt(promptEvent);
        
        // Show install prompt after a short delay to avoid interrupting user
        // This gives the page time to load before showing the prompt
        setTimeout(() => {
          if (!checkInstalled() && !sessionStorage.getItem('pwa-install-dismissed')) {
            setShowInstallPrompt(true);
          }
        }, 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      // Show the install prompt - this is required after preventDefault()
      // The browser expects us to call prompt() when user wants to install
      deferredPrompt.prompt();
      
      // Wait for user's choice
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setShowInstallPrompt(false);
        setIsInstalled(true);
        console.log('User accepted the install prompt');
      } else {
        // User dismissed, hide prompt for this session
        setShowInstallPrompt(false);
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      setShowInstallPrompt(false);
    } finally {
      // Clear the deferred prompt after use (can only be used once)
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  // Check if user dismissed it in this session
  if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-up">
      <div className="glass-premium rounded-2xl p-4 border-white/30 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-white font-black text-lg mb-1">התקן את האפליקציה</h3>
            <p className="text-white/80 text-sm mb-3">
              התקן את EnglishPath למסך הבית לגישה מהירה יותר
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all"
              >
                התקן
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-white/60 hover:text-white text-sm font-medium transition-all"
              >
                לא עכשיו
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white transition-all"
            aria-label="סגור"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
