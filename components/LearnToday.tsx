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
            const categoryToUse = category || todayPlan?.id?.match(/category-(.+?)-level/)?.[1];
            const levelToUse = level || todayPlan?.id?.match(/level-(\d+)/)?.[1];
            if (categoryToUse) {
              const quizUrl = `/learn?mode=quiz&category=${encodeURIComponent(categoryToUse)}${levelToUse ? `&level=${levelToUse}` : ''}`;
              router.push(quizUrl);
            } else {
              router.push('/learn?mode=quiz');
            }
            setTimeout(() => router.refresh(), 100);
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
    <div className="p-4 md:p-8 animate-fade-in flex flex-col max-w-4xl mx-auto min-h-0 relative">
      {/* Saturated Neon Accents */}
      <div className="absolute top-20 -left-20 w-64 h-64 bg-primary-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-purple-600/30 rounded-full blur-[120px] animate-blob delay-2000 mix-blend-screen" />

      {/* Word Counter */}
      <div className="mb-6 text-center">
        <span className="text-xl font-bold text-white/80">
          מילה {currentIndex + 1} מתוך {words.length}
        </span>
      </div>

      {/* Flashcard (3D Tilt Effect) */}
      <div
        className="relative perspective-2000 group mb-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="glass-premium rounded-[3rem] p-12 md:p-20 text-center border-white/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-7xl md:text-9xl font-black mb-4 text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] tracking-tighter text-shimmer">
              {word.englishWord}
            </h2>
            <p className="text-3xl md:text-5xl font-bold text-primary-200 mb-8 drop-shadow-sm" dir="rtl">
              {word.hebrewTranslation}
            </p>
            <div className="flex justify-center mb-8">
              <button
                onClick={() => speakWord(word.englishWord)}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-400 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all group"
              >
                <Volume2 className="w-12 h-12 group-hover:animate-pulse" />
              </button>
            </div>
            {word.exampleEn && (
              <div className="glass-card rounded-[2rem] p-8 border-white/20 bg-white/5 glow-primary animate-slide-up">
                <p className="text-2xl md:text-3xl font-bold text-white mb-4 leading-relaxed tracking-wide italic">
                  "{word.exampleEn}"
                </p>
                <p className="text-xl text-primary-200 font-black" dir="rtl">
                  {word.exampleHe}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-6 items-center justify-between mt-6 pb-12">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isProcessing}
          className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border border-white/20
                        ${currentIndex === 0
              ? 'bg-white/5 text-white/20 cursor-not-allowed'
              : 'glass-card text-white hover:scale-110 active:scale-95 glow-primary'
            }`}
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        <button
          onClick={handleNext}
          disabled={isProcessing}
          className="flex-1 h-20 rounded-[2rem] text-3xl font-black text-white bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 shadow-[0_15px_40px_-10px_rgba(236,72,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 glow-primary"
        >
          <span>{currentIndex < words.length - 1 ? 'המילה הבאה' : 'סיים יחידה!'}</span>
          <ChevronLeft className={`w-8 h-8 ${currentIndex < words.length - 1 ? 'animate-bounce-x' : ''}`} />
        </button>
      </div>
    </div>
  );
}
