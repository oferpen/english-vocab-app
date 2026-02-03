'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { markWordSeen } from '@/app/actions/progress';
import { completeLearningSession } from '@/app/actions/learning';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound } from '@/lib/sounds';
import { Volume2, ChevronRight, ChevronLeft } from 'lucide-react';

interface LearnTodayProps {
  userId: string;
  todayPlan: any;
  wordId?: string;
  category?: string;
  level?: number;
  onModeSwitch?: (mode: 'learn' | 'quiz') => void;
  currentMode?: 'learn' | 'quiz';
}

export default function LearnToday({ userId, todayPlan, wordId, category, level, onModeSwitch, currentMode: propMode }: LearnTodayProps) {
  const searchParams = useSearchParams();
  const urlLevel = searchParams?.get('level');
  const levelToUse = level || (urlLevel ? parseInt(urlLevel) : undefined);
  const currentMode = propMode || searchParams?.get('mode') || 'learn';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const prevModeRef = useRef<string>(currentMode);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: y * -10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const words = todayPlan?.words?.map((w: any) => w.word) || [];

  useEffect(() => {
    if (wordId && words.length > 0) {
      const wordIndex = words.findIndex((w: any) => w.id === wordId);
      if (wordIndex >= 0) {
        setCurrentIndex(wordIndex);
      }
    }
    if (words.length === 0) {
      setCompleted(true);
    }
  }, [wordId, words.length]);

  useEffect(() => {
    const wasInQuiz = prevModeRef.current === 'quiz';
    const isNowInLearn = currentMode === 'learn';
    if (wasInQuiz && isNowInLearn) {
      setCompleted(false);
      setShowCelebration(false);
      setShowConfetti(false);
    }
    prevModeRef.current = currentMode;
  }, [currentMode]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = async () => {
    if (isProcessingRef.current) return;
    const word = words[currentIndex];
    if (currentIndex < words.length - 1) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      startTransition(async () => {
        await markWordSeen(userId, word.id);
        isProcessingRef.current = false;
        setIsProcessing(false);
      });
      playSuccessSound();
      setCurrentIndex(currentIndex + 1);
    } else {
      isProcessingRef.current = true;
      setIsProcessing(true);
      playSuccessSound();
      const xp = words.length * 5;
      setXpGained(xp);
      setShowCelebration(true);
      setCompleted(true);
      completeLearningSession(userId, word.id, words.length, xp)
        .finally(() => {
          isProcessingRef.current = false;
          setIsProcessing(false);
        });
    }
  };

  const speakWord = (text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (words.length === 0) {
    return (
      <div className="p-4 text-center glass-premium rounded-3xl p-10">
        <p className="text-2xl text-white font-black mb-4">אין מילים ללמידה היום</p>
        <p className="text-white/60">בקש מהורה להגדיר תוכנית יומית</p>
      </div>
    );
  }

  if (showCelebration && completed) {
    const percentage = 100;
    return (
      <>
        <Confetti trigger={showCelebration && percentage >= 70} />
        <CelebrationScreen
          title="סיימת ללמוד!"
          message={`סיימת ללמוד ${words.length} מילים היום! קיבלת ${xpGained} נקודות נסיון!`}
          emoji={percentage >= 70 ? '🎉' : '💪'}
          showConfetti={showCelebration && percentage >= 70}
          actionLabel="עבור לחידון"
          onAction={() => {
            // Extract category from multiple sources in order of priority
            let categoryToUse = category;
            
            // 1. Try to get from URL search params if not in prop
            if (!categoryToUse) {
              const urlCategory = searchParams?.get('category');
              if (urlCategory) {
                categoryToUse = urlCategory;
              }
            }
            
            // 2. Try to extract from todayPlan.id if still not found
            if (!categoryToUse && todayPlan?.id) {
              // Try pattern with level first (learn mode): category-{name}-level-{number}
              const matchWithLevel = todayPlan.id.match(/category-(.+?)-level/);
              if (matchWithLevel && matchWithLevel[1]) {
                categoryToUse = matchWithLevel[1];
              } else {
                // Try pattern without level (quiz mode or simple format): category-{name}
                const matchSimple = todayPlan.id.match(/^category-(.+)$/);
                if (matchSimple && matchSimple[1]) {
                  categoryToUse = matchSimple[1];
                }
              }
            }
            
            // Get level from prop, URL, or todayPlan (use the component-level levelToUse if available)
            const quizLevel = levelToUse || (searchParams?.get('level') ? parseInt(searchParams.get('level')!) : undefined) || todayPlan?.id?.match(/level-(\d+)/)?.[1];
            
            // Ensure we have a category before redirecting
            if (categoryToUse && categoryToUse.trim() !== '') {
              const quizUrl = `/learn?mode=quiz&category=${encodeURIComponent(categoryToUse.trim())}${quizLevel ? `&level=${quizLevel}` : ''}`;
              // Use window.location for full page reload to ensure proper state
              window.location.href = quizUrl;
            } else {
              // Fallback: redirect to path if no category found
              console.warn('No category found for quiz redirect, redirecting to path');
              window.location.href = '/learn/path';
            }
          }}
          onClose={() => {
            router.push('/learn/path');
            setTimeout(() => router.refresh(), 100);
          }}
        />
      </>
    );
  }

  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="px-2 pt-4 pb-16 sm:p-4 md:p-8 animate-fade-in flex flex-col w-full max-w-sm sm:max-w-2xl md:max-w-4xl mx-auto relative overflow-hidden justify-start sm:justify-center">
      {/* Saturated Neon Accents */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-primary-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-purple-600/30 rounded-full blur-[120px] animate-blob delay-2000 mix-blend-screen" />

      {/* Word Counter */}
      <div className="mb-2 sm:mb-1.5 md:mb-2 lg:mb-3 text-center">
        <span className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-white/80">
          מילה {currentIndex + 1} מתוך {words.length}
        </span>
      </div>

      {/* Flashcard (3D Tilt Effect) */}
      <div
        className="relative perspective-2000 group mb-8 sm:mb-3 md:mb-4 lg:mb-6"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="glass-premium rounded-lg sm:rounded-xl md:rounded-[2rem] lg:rounded-[3rem] p-20 sm:p-3 md:p-4 lg:p-6 xl:p-10 text-center border-white/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-visible">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-6xl sm:text-2xl md:text-4xl lg:text-6xl xl:text-8xl font-black mb-2 sm:mb-1 md:mb-1.5 lg:mb-2 xl:mb-3 text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] tracking-tighter text-shimmer">
              {word.englishWord}
            </h2>
            <p className="text-lg sm:text-sm md:text-base lg:text-xl xl:text-3xl font-bold text-primary-200 mb-3 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 drop-shadow-sm" dir="rtl">
              {word.hebrewTranslation}
            </p>
            <div className="flex justify-center mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4">
              <button
                onClick={() => speakWord(word.englishWord)}
                className="w-16 h-16 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-xl sm:rounded-lg md:rounded-xl lg:rounded-2xl xl:rounded-3xl bg-gradient-to-br from-primary-400 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all group"
              >
                <Volume2 className="w-8 h-8 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-9 xl:h-9 group-hover:animate-pulse" />
              </button>
            </div>
            {word.exampleEn && (
              <div className="glass-card rounded-md sm:rounded-lg md:rounded-xl lg:rounded-[2rem] p-1 sm:p-1.5 md:p-2 lg:p-3 xl:p-4 border-white/20 bg-white/5 glow-primary animate-slide-up hidden sm:block">
                <p className="text-[10px] sm:text-xs md:text-xs lg:text-sm xl:text-lg font-bold text-white mb-0.5 sm:mb-1 md:mb-1 lg:mb-1.5 xl:mb-2 leading-tight tracking-wide italic">
                  "{word.exampleEn}"
                </p>
                <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-xs xl:text-sm text-primary-200 font-black" dir="rtl">
                  {word.exampleHe}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls - Ensure button is always visible */}
      <div className="flex gap-1.5 sm:gap-2 md:gap-3 lg:gap-6 items-center justify-between mt-8 sm:mt-2 md:mt-3 lg:mt-4 relative z-10">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isProcessing}
          className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border border-white/20
                        ${currentIndex === 0
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'glass-card text-white hover:scale-110 active:scale-95 glow-primary'
            }`}
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:w-6 xl:w-7 xl:h-7" />
        </button>

        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="flex-1 h-9 sm:h-10 md:h-12 lg:h-14 xl:h-16 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-[2rem] text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-black text-white bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 shadow-[0_15px_40px_-10px_rgba(236,72,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 xl:gap-4 glow-primary"
        >
          <span>{currentIndex < words.length - 1 ? 'המילה הבאה' : 'סיים יחידה!'}</span>
          <ChevronLeft className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 ${currentIndex < words.length - 1 ? 'animate-bounce-x' : ''}`} />
        </button>
      </div>
    </div>
  );
}
