'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { markWordSeen } from '@/app/actions/progress';
import { completeLearningSession } from '@/app/actions/learning';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound } from '@/lib/sounds';

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
      // Always reset completion state when switching back to learn mode
      // This prevents blank screen and allows users to continue learning
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
    // Prevent multiple calls using ref for immediate synchronous check
    if (isProcessingRef.current) {
      return;
    }
    
    const word = words[currentIndex];
    
    if (currentIndex < words.length - 1) {
      // For non-final words, mark as seen and move forward
      isProcessingRef.current = true;
      setIsProcessing(true);
      startTransition(async () => {
        await markWordSeen(childId, word.id);
        isProcessingRef.current = false;
        setIsProcessing(false);
      });
      
      // Play success sound
      playSuccessSound();
      
      // Move to next word (no confetti during learning)
      setCurrentIndex(currentIndex + 1);
    } else {
      // For final word, mark as seen and show completion celebration
      isProcessingRef.current = true;
      setIsProcessing(true);
      
      // Play success sound first
      playSuccessSound();
      
      // Show big celebration for completion
      const xp = words.length * 5;
      setXpGained(xp);
      setShowCelebration(true);
      setCompleted(true); // Set completed to true so celebration screen shows
      
      // Use combined server action to reduce HTTP requests from 3 to 1
      // Call directly without startTransition to prevent duplicate calls
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
        <p className="text-xl text-gray-600 mb-4">אין מילים ללמידה היום</p>
        <p className="text-gray-500">בקש מהורה להגדיר תוכנית יומית</p>
      </div>
    );
  }

  // Only show celebration screen if we're actually showing celebration
  // Don't show if we're just in completed state but switched back from quiz
  if (showCelebration && completed) {
    return (
      <>
        <Confetti trigger={showCelebration} />
        <CelebrationScreen
          title="כל הכבוד! 🎉"
          message={`סיימת ללמוד ${words.length} מילים היום! קיבלת ${xpGained} נקודות נסיון!`}
          emoji="⭐"
          showConfetti={showCelebration}
          actionLabel="המשך לחידון ←"
          onAction={() => {
            if (isNavigating) return; // Prevent multiple calls
            
            setIsNavigating(true);
            setShowCelebration(false);
            setCompleted(true);
            
            // Use client-side mode switch if available (no page reload)
            if (onModeSwitch) {
              onModeSwitch('quiz');
              setIsNavigating(false);
            } else {
              // Fallback to navigation if callback not available
              const categoryToUse = category || todayPlan?.id?.match(/category-(.+?)-level/)?.[1];
              const levelToUse = level || todayPlan?.id?.match(/level-(\d+)/)?.[1];
              
              if (categoryToUse) {
                const quizUrl = `/learn?mode=quiz&category=${encodeURIComponent(categoryToUse)}${levelToUse ? `&level=${levelToUse}` : ''}`;
                startTransition(() => {
                  router.replace(quizUrl);
                });
              } else {
                startTransition(() => {
                  router.replace('/learn?mode=quiz');
                });
              }
            }
          }}
          onClose={() => {
            // Only close, don't navigate - navigation is handled by onAction
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
      <div className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-200px)] animate-fade-in">
        {/* Progress Bar */}
      <div className="mb-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {currentIndex + 1} מתוך {words.length}
          </span>
          <span className="text-sm font-bold text-primary-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Word Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-6 border border-gray-100 animate-slide-up">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-primary-600 drop-shadow-sm">{word.englishWord}</h2>
          <p className="text-3xl md:text-4xl mb-8 text-gray-800 font-semibold">{word.hebrewTranslation}</p>
          
          {word.exampleEn && (
            <div className="mt-6 p-6 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 rounded-xl border border-primary-100 shadow-sm">
              <p className="text-lg md:text-xl text-gray-800 mb-2 font-semibold">{word.exampleEn}</p>
              <p className="text-lg md:text-xl text-gray-600">{word.exampleHe}</p>
            </div>
          )}

          <button
            onClick={() => speakWord(word.englishWord)}
            className="mt-8 text-5xl md:text-6xl hover:scale-110 active:scale-95 transition-all duration-200 hover:drop-shadow-lg"
            aria-label="השמע הגייה"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isProcessing}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-5 md:py-6 rounded-xl text-xl md:text-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="text-2xl">→</span>
          <span>קודם</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={isProcessing}
          className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-5 md:py-6 rounded-xl text-xl md:text-2xl font-bold shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span className="text-2xl">←</span>
          <span>הבא</span>
        </button>
      </div>
      </div>
    </>
  );
}
