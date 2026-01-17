'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import ChildSwitcher from './ChildSwitcher';

interface WelcomeScreenProps {
  childName: string;
  avatar?: string;
  level?: number;
  streak?: number;
  isParentLoggedIn?: boolean;
  showProgress?: boolean;
  currentChildId?: string;
}

export default function WelcomeScreen({ childName, avatar, level, streak, isParentLoggedIn = false, showProgress = true, currentChildId }: WelcomeScreenProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleStart = () => {
    setShowWelcome(false);
    if (pathname === '/') {
      if (childName && childName.trim()) {
        router.push('/learn');
      } else {
        // If no child is logged in, show child selection screen
        // This will be handled by the parent component
        router.push('/');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    }
  };


  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background with gradient and shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 via-pink-400 to-orange-300">
        {/* Animated circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Floating stars */}
        <div className="absolute top-1/4 left-1/4 text-4xl opacity-20 animate-float">⭐</div>
        <div className="absolute top-1/3 right-1/4 text-3xl opacity-20 animate-float animation-delay-1000">✨</div>
        <div className="absolute bottom-1/4 left-1/2 text-4xl opacity-20 animate-float animation-delay-2000">🌟</div>
        <div className="absolute top-1/2 right-1/3 text-3xl opacity-20 animate-float animation-delay-3000">💫</div>
      </div>
      
      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in border border-white/20">
        <div className="text-6xl mb-4 animate-bounce">
          {avatar || '👋'}
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {childName && childName.trim() ? `שלום ${childName}!` : 'ברוכים הבאים!'}
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          בואו נתחיל ללמוד אנגלית
        </p>
        
        {/* Show progress only if child is logged in */}
        {showProgress && (level || streak !== undefined) && (
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
        
        {childName && childName.trim() && (
          <div className="mb-6 flex flex-col items-center gap-2">
            <ChildSwitcher currentChildId={currentChildId} currentChildName={childName} />
            <LogoutButton />
          </div>
        )}

        {childName && childName.trim() && (
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            בואו נתחיל! 🚀
          </button>
        )}
        
        {(!childName || !childName.trim()) && (
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            בחר ילד להתחיל 🚀
          </button>
        )}
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
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.4;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
