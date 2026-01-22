'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

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
        router.push('/learn/path');
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
          <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-5 mb-6 border border-primary-100 shadow-sm">
            {level && (
              <div className="text-lg md:text-xl mb-2">
                <span className="font-bold text-primary-600">רמה {level}</span>
              </div>
            )}
            {streak !== undefined && streak > 0 && (
              <div className="text-lg md:text-xl">
                <span className="font-bold text-orange-600">רצף: {streak} ימים 🔥</span>
              </div>
            )}
          </div>
        )}
        
        {childName && childName.trim() && (
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-5 rounded-xl text-xl md:text-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            בואו נתחיל! 🚀
          </button>
        )}
        
        {(!childName || !childName.trim()) && (
          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-5 rounded-xl text-xl md:text-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 active:scale-95"
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
