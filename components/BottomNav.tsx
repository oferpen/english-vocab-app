'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  
  // Get category and mode from current URL (works for both learn and quiz pages)
  const category = searchParams?.get('category');
  const level = searchParams?.get('level');
  const mode = searchParams?.get('mode');
  
  // Determine if we're on quiz or learn page
  const isQuizPage = pathname === '/quiz' || (pathname === '/learn' && mode === 'quiz');
  const isLearnPage = pathname === '/learn' || pathname?.startsWith('/learn/');
  
  // Build learn URL:
  // - If on learn page with category, stay there with mode=learn
  // - If on quiz page with category, go to learn page with same category
  // - Otherwise, go to path
  const learnHref = category 
    ? `/learn?mode=learn&category=${encodeURIComponent(category)}${level ? `&level=${level}` : ''}`
    : '/learn/path';
  
  // Build quiz URL with category if available
  const quizHref = category ? `/learn?mode=quiz&category=${encodeURIComponent(category)}${level ? `&level=${level}` : ''}` : '/learn?mode=quiz';

  // Keep menu always visible - no scroll hiding
  useEffect(() => {
    setIsVisible(true);
  }, [pathname]);

  // Handle mode switching on learn page (client-side navigation to avoid full page reload)
  const handleModeSwitch = (newMode: 'learn' | 'quiz') => {
    if (pathname === '/learn' && category) {
      // Use client-side navigation for mode switching on learn page
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('mode', newMode);
      if (category) params.set('category', category);
      if (level) params.set('level', level);
      router.replace(`/learn?${params.toString()}`, { scroll: false });
    } else {
      // Use regular navigation for other cases
      const url = newMode === 'learn' ? learnHref : quizHref;
      router.push(url);
    }
  };

  // Quiz page footer design - more action-oriented with gradient (positioned at top)
  if (isQuizPage) {
    return (
      <nav className={`fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 shadow-2xl z-[100] transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-0'}`}>
        <div className="flex justify-around items-center h-20 md:h-24 px-4">
          <button
            onClick={() => handleModeSwitch('learn')}
            className="flex flex-col items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-200 hover:bg-white/30 hover:scale-105 active:scale-95"
          >
            <span className="text-3xl md:text-4xl mb-1">📚</span>
            <span className="text-sm md:text-base font-bold text-white drop-shadow-lg">ללמוד</span>
          </button>
          <div className="flex-1"></div>
          <Link
            href="/learn/path"
            className="flex flex-col items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-200 hover:bg-white/30 hover:scale-105 active:scale-95"
          >
            <span className="text-3xl md:text-4xl mb-1">🏠</span>
            <span className="text-sm md:text-base font-bold text-white drop-shadow-lg">נתיב</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Learn page footer design - cleaner, more navigation-focused (positioned at top)
  if (isLearnPage) {
    return (
      <nav className={`fixed top-0 left-0 right-0 bg-gradient-to-br from-blue-50 to-indigo-100 border-b-2 border-blue-200 shadow-xl z-[100] transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-0'}`}>
        <div className="flex justify-around items-center h-20 md:h-20 px-4">
          <button
            onClick={() => handleModeSwitch('learn')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
              (pathname === '/learn' && mode !== 'quiz') || pathname?.startsWith('/learn/')
                ? 'text-blue-600 scale-110' 
                : 'text-gray-600 hover:text-blue-500 hover:scale-105'
            }`}
          >
            <span className="text-2xl md:text-3xl mb-1 transition-transform duration-200">📖</span>
            <span className={`text-xs md:text-sm font-semibold ${(pathname === '/learn' && mode !== 'quiz') || pathname?.startsWith('/learn/') ? 'font-bold' : ''}`}>ללמוד</span>
          </button>
          <button
            onClick={() => handleModeSwitch('quiz')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
              isQuizPage
                ? 'text-purple-600 scale-110' 
                : 'text-gray-600 hover:text-purple-500 hover:scale-105'
            }`}
          >
            <span className="text-2xl md:text-3xl mb-1 transition-transform duration-200">✏️</span>
            <span className={`text-xs md:text-sm font-semibold ${isQuizPage ? 'font-bold' : ''}`}>חידון</span>
          </button>
          <Link
            href="/learn/path"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
              pathname === '/learn/path'
                ? 'text-indigo-600 scale-110' 
                : 'text-gray-600 hover:text-indigo-500 hover:scale-105'
            }`}
          >
            <span className="text-2xl md:text-3xl mb-1 transition-transform duration-200">🗺️</span>
            <span className={`text-xs md:text-sm font-semibold ${pathname === '/learn/path' ? 'font-bold' : ''}`}>נתיב</span>
          </Link>
        </div>
      </nav>
    );
  }

  // Default footer design (for other pages like path, progress, etc.)
  const navItems = [
    { href: learnHref, label: 'ללמוד', icon: '📚' },
    { href: quizHref, label: 'חידון', icon: '✏️' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 bg-white border-b-2 border-gray-200 shadow-2xl z-[100] transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-0'}`}>
      <div className="flex justify-around items-center h-16 md:h-20">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href) || (item.href === '/learn/path' && (pathname === '/learn' || pathname === '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                isActive 
                  ? 'text-primary-600 scale-110' 
                  : 'text-gray-500 hover:text-primary-500 hover:scale-105'
              }`}
            >
              <span className="text-2xl md:text-3xl mb-1 transition-transform duration-200">{item.icon}</span>
              <span className={`text-xs md:text-sm font-semibold ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
