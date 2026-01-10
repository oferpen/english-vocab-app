'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface WelcomeScreenProps {
  childName: string;
  avatar?: string;
  level?: number;
  streak?: number;
}

export default function WelcomeScreen({ childName, avatar, level, streak }: WelcomeScreenProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if welcome was already shown today
    const welcomeShown = sessionStorage.getItem('welcomeShown');
    if (welcomeShown) {
      setShowWelcome(false);
      // If already shown, redirect immediately if on home page
      if (pathname === '/') {
        router.push('/learn');
      }
      return;
    }

    // Hide welcome after 5 seconds and redirect
    const timer = setTimeout(() => {
      setShowWelcome(false);
      sessionStorage.setItem('welcomeShown', 'true');
      if (pathname === '/') {
        router.push('/learn');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [pathname, router]);

  const handleStart = () => {
    setShowWelcome(false);
    sessionStorage.setItem('welcomeShown', 'true');
    if (pathname === '/') {
      router.push('/learn');
    }
  };

  const handleSkip = () => {
    setShowWelcome(false);
    sessionStorage.setItem('welcomeShown', 'true');
    if (pathname === '/') {
      router.push('/learn');
    }
  };

  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
        <div className="text-6xl mb-4 animate-bounce">
          {avatar || '👋'}
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          שלום {childName}!
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          בואו נתחיל ללמוד אנגלית
        </p>
        
        {(level || streak !== undefined) && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            {level && (
              <div className="text-lg mb-2">
                <span className="font-bold text-blue-600">רמה {level}</span>
              </div>
            )}
            {streak !== undefined && streak > 0 && (
              <div className="text-lg">
                <span className="font-bold text-orange-600">רצף: {streak} ימים 🔥</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          בואו נתחיל! 🚀
        </button>
        
        <button
          onClick={handleSkip}
          className="mt-4 text-gray-500 text-sm hover:text-gray-700"
        >
          דלג
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
