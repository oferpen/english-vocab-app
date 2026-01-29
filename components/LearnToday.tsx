'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { markWordSeen } from '@/app/actions/progress';
import { completeLearningSession } from '@/app/actions/learning';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound } from '@/lib/sounds';
import { Volume2, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

interface LearnTodayProps {
  childId: string;
  todayPlan: any;
  wordId?: string;
  category?: string;
  level?: number;
  onModeSwitch?: (mode: 'learn' | 'quiz') => void;
  currentMode?: 'learn' | 'quiz'; // Pass mode as prop for reliable detection
}

export default function LearnToday({ childId, todayPlan, wordId, category, level, onModeSwitch, currentMode: propMode }: LearnTodayProps) {
  const searchParams = useSearchParams();
  const urlLevel = searchParams?.get('level');
  const levelToUse = level || (urlLevel ? parseInt(urlLevel) : undefined);
  const currentMode = propMode || searchParams?.get('mode') || 'learn';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false); // Prevent multiple navigations
  const [isProcessing, setIsProcessing] = useState(false); // Prevent multiple processing
  const isProcessingRef = useRef(false); // Use ref for immediate synchronous check
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const prevModeRef = useRef<string>(currentMode);

  const words = todayPlan?.words?.map((w: any) => w.word) || [];

  useEffect(() => {
    // If a specific wordId is provided, find its index
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

  // Reset completion state when switching back to learn mode from quiz
  useEffect(() => {
    const wasInQuiz = prevModeRef.current === 'quiz';
    const isNowInLearn = currentMode === 'learn';

    // When switching back to learn mode from quiz, reset completion state
    if (wasInQuiz && isNowInLearn) {
      setCompleted(false);
      setShowCelebration(false);
      setShowConfetti(false);
      setIsNavigating(false);
    }

    // Update previous mode
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
        await markWordSeen(childId, word.id);
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
      completeLearningSession(childId, word.id, words.length, xp)
        .then(() => {
          isProcessingRef.current = false;
          setIsProcessing(false);
        })
        .catch((error) => {
          console.error('Error completing learning session:', error);
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
      <div className="p-4 text-center">
        <p className="text-xl text-neutral-600 mb-4">אין מילים ללמידה היום</p>
        <p className="text-neutral-500">בקש מהורה להגדיר תוכנית יומית</p>
      </div>
    );
  }

  if (showCelebration && completed) {
    return (
      <>
        <Confetti trigger={showCelebration} />
        <CelebrationScreen
          title="סיימת ללמוד!"
          message={`סיימת ללמוד ${words.length} מילים היום! קיבלת ${xpGained} נקודות נסיון!`}
          emoji="🎉"
          showConfetti={showCelebration}
          actionLabel="המשך לחידון"
          onAction={() => {
            if (isNavigating) return;
            setIsNavigating(true);
            setShowCelebration(false);
            setCompleted(true);
            if (onModeSwitch) {
              onModeSwitch('quiz');
              setIsNavigating(false);
            } else {
              const categoryToUse = category || todayPlan?.id?.match(/category-(.+?)-level/)?.[1];
              const levelToUse = level || todayPlan?.id?.match(/level-(\d+)/)?.[1];
              if (categoryToUse) {
                const quizUrl = `/learn?mode=quiz&category=${encodeURIComponent(categoryToUse)}${levelToUse ? `&level=${levelToUse}` : ''}`;
                startTransition(() => { router.replace(quizUrl); });
              } else {
                startTransition(() => { router.replace('/learn?mode=quiz'); });
              }
            }
          }}
          onClose={() => {
            setShowCelebration(false);
            setCompleted(true);
          }}
        />
      </>
    );
  }

  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <>
      <div className="max-w-md mx-auto px-4 py-8 animate-fade-in">
        {/* Progress Bar (Pill) */}
        <div className="mb-8 flex items-center justify-between bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-100">
          <div className="text-xs font-bold text-neutral-400">מילה {currentIndex + 1} מתוך {words.length}</div>
          <div className="flex-1 mx-4 bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs font-bold text-primary-600">{Math.round(progress)}%</div>
        </div>

        {/* Flashcard (3D Effect) */}
        <div className="relative perspective-1000 group mb-8">
          <div className="bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-neutral-100 p-8 md:p-12 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)]">
            <h2 className="text-5xl md:text-6xl font-black text-neutral-800 mb-4 tracking-tight">
              {word.englishWord}
            </h2>
            <p className="text-3xl font-medium text-neutral-400 mb-8" dir="rtl">
              {word.hebrewTranslation}
            </p>
            <button
              onClick={() => speakWord(word.englishWord)}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 hover:scale-110 transition-all duration-200 shadow-sm"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            {word.exampleEn && (
              <div className="mt-8 pt-8 border-t border-neutral-100 text-left">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-lg font-medium text-neutral-700 mb-1 leading-snug tracking-tight">{word.exampleEn}</p>
                  <p className="text-base text-neutral-400" dir="rtl">{word.exampleHe}</p>
                </div>
              </div>
            )}
          </div>
          <div className="absolute top-4 inset-x-4 h-full bg-white rounded-[2rem] shadow-sm -z-10 bg-opacity-50 transform scale-95 translate-y-3"></div>
          <div className="absolute top-8 inset-x-8 h-full bg-white rounded-[2rem] shadow-sm -z-20 bg-opacity-30 transform scale-90 translate-y-5"></div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 items-center justify-between mt-4">
          {/* Prev points Right in RTL */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isProcessing}
            className={`
                h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md
                ${currentIndex === 0
                ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                : 'bg-white text-neutral-600 hover:bg-neutral-50 hover:scale-105 active:scale-95'
              }
             `}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Next points Left in RTL */}
          <button
            onClick={handleNext}
            disabled={isProcessing}
            className="flex-1 h-16 rounded-2xl bg-primary-500 text-white font-black text-xl shadow-lg shadow-primary-200 transition-all duration-200 hover:bg-primary-600 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 tracking-tight"
          >
            <span>הבא</span>
            <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
