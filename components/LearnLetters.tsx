'use client';

import { useState, useEffect, useTransition } from 'react';
import { markLetterSeen, getAllLetters, getUnmasteredLetters } from '@/app/actions/letters';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound } from '@/lib/sounds';
import { Volume2, X, Check, Sparkles } from 'lucide-react';

interface LearnLettersProps {
  userId: string;
  letterId?: string;
}

export default function LearnLetters({ userId, letterId }: LearnLettersProps) {
  const [letters, setLetters] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    loadLetters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, letterId]);

  const loadLetters = async () => {
    try {
      setLoading(true);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      // If a specific letterId is provided, load that letter
      if (letterId) {
        const allLetters = await Promise.race([
          getAllLetters(),
          timeoutPromise
        ]) as any[];
        const letterIndex = allLetters.findIndex((l: any) => l.id === letterId);
        if (letterIndex >= 0) {
          setLetters(allLetters);
          setCurrentIndex(letterIndex);
        } else {
          // Letter not found, fall back to unmastered
          const unmastered = await Promise.race([
            getUnmasteredLetters(userId),
            timeoutPromise
          ]) as any[];
          setLetters(unmastered);
        }
      } else {
        const unmastered = await Promise.race([
          getUnmasteredLetters(userId),
          timeoutPromise
        ]) as any[];

        if (unmastered.length === 0) {
          // All letters mastered, check if can advance to level 2
          const { checkLevel1Complete } = await import('@/app/actions/letters');
          const level1Complete = await Promise.race([
            checkLevel1Complete(userId),
            timeoutPromise
          ]) as boolean;

          if (level1Complete) {
            setCompleted(true);
          } else {
            // Show all letters for review
            const allLetters = await Promise.race([
              getAllLetters(),
              timeoutPromise
            ]) as any[];
            setLetters(allLetters);
          }
        } else {
          setLetters(unmastered);
        }
      }
    } catch (error: any) {
      // If it's a database error or timeout, show a helpful message
      if (error?.message?.includes('does not exist') || error?.code === 'P2021' || error?.message === 'Request timeout') {
        setLetters([]);
        setLoading(false);
      } else {
        // Show error message to user
        setLetters([]);
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkLearned = async (correct: boolean, e?: React.MouseEvent) => {
    // Prevent any default behavior that might cause page refresh
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const letter = letters[currentIndex];
    const currentIdx = currentIndex;

    // Update UI optimistically first (before server call) - move to next letter immediately
    if (currentIdx < letters.length - 1) {
      setCurrentIndex(currentIdx + 1);
    }

    // Use startTransition to mark server action as non-urgent, preventing blocking updates
    startTransition(async () => {
      await markLetterSeen(userId, letter.id, correct);

      // Play success sound if correct
      if (correct) {
        playSuccessSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);
      }

      // Handle completion logic (only if we were at the last letter)
      if (currentIdx >= letters.length - 1) {
        // Check if level 1 is complete
        const { checkLevel1Complete } = await import('@/app/actions/letters');
        const level1Complete = await checkLevel1Complete(userId);

        if (level1Complete) {
          // Unlock level 2
          const { checkAndUnlockLevel2 } = await import('@/app/actions/levels');
          await checkAndUnlockLevel2(userId);
          await addXP(userId, 50); // Award XP for completing level 1
          setShowCelebration(true);
        } else {
          // Reload letters to get next batch
          await loadLetters();
          setCurrentIndex(0);
        }
      }
    });
  };

  const speakLetter = (text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
        <p className="text-xl text-gray-600 mt-4">טוען אותיות...</p>
      </div>
    );
  }

  if (completed || showCelebration) {
    return (
      <>
        <Confetti trigger={showCelebration} />
        <CelebrationScreen
          title="כל הכבוד!"
          message="סיימת ללמוד את כל האותיות! עכשיו אתה יכול להתחיל ללמוד מילים!"
          emoji="🎉"
          showConfetti={showCelebration}
          actionLabel="המשך למילים"
          onAction={() => {
            setShowCelebration(false);
            setCompleted(true);
            router.push('/learn/path');
          }}
          onClose={() => {
            setShowCelebration(false);
            setCompleted(true);
            router.push('/learn/path');
          }}
        />
      </>
    );
  }

  if (letters.length === 0 && !loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-gray-600 mb-4">אין אותיות ללמידה</p>
        <p className="text-sm text-gray-500 mb-4">ייתכן שהטבלה עדיין לא נוצרה. נסה לרענן את הדף.</p>
        <button
          onClick={() => {
            setLoading(true);
            loadLetters();
          }}
          className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  const letter = letters[currentIndex];
  const progress = ((currentIndex + 1) / letters.length) * 100;

  return (
    <>
      <Confetti trigger={showConfetti} duration={1500} />
      <div className="max-w-md mx-auto px-4 py-4 animate-fade-in text-center">
        {/* Progress Bar (Pill) */}
        <div className="mb-4 flex items-center justify-between bg-white px-4 py-2 rounded-full shadow-sm border border-neutral-100">
          <div className="text-xs font-bold text-neutral-400">
            {currentIndex + 1} מתוך {letters.length}
          </div>
          <div className="flex-1 mx-4 bg-neutral-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs font-bold text-primary-600">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Flashcard (3D Effect) */}
        <div className="relative perspective-1000 group mb-4">
          <div className="bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-neutral-100 p-6 md:p-8 text-center transition-all duration-300 transform hover:scale-[1.01] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)]">
            <h2 className="text-7xl md:text-8xl font-black text-neutral-800 mb-2 tracking-tight">
              {letter.letter}
            </h2>
            <div className="space-y-0.5 mb-4">
              <p className="text-2xl md:text-3xl font-black text-neutral-800 tracking-tight">
                {letter.name}
              </p>
              {letter.hebrewName && (
                <p className="text-xl md:text-2xl font-medium text-neutral-400">
                  {letter.hebrewName}
                </p>
              )}
            </div>

            {letter.sound && (
              <div className="bg-neutral-50 rounded-xl p-2 px-4 border border-neutral-100 mb-4 inline-block">
                <p className="text-base md:text-lg font-medium text-neutral-500">
                  הגייה: <span className="text-neutral-700">{letter.sound}</span>
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => speakLetter(letter.letter)}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm"
                aria-label="השמע הגייה"
              >
                <Volume2 className="w-8 h-8" />
              </button>
            </div>
          </div>
          <div className="absolute top-4 inset-x-4 h-full bg-white rounded-[2rem] shadow-sm -z-10 bg-opacity-50 transform scale-95 translate-y-3"></div>
          <div className="absolute top-8 inset-x-8 h-full bg-white rounded-[2rem] shadow-sm -z-20 bg-opacity-30 transform scale-90 translate-y-5"></div>
        </div>

        {/* Action Buttons */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/learn?mode=quiz')}
            className="w-full py-3 rounded-2xl bg-primary-50 text-primary-600 font-bold text-base border-2 border-primary-100 hover:bg-primary-100 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>התחל חידון אותיות</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            type="button"
            onClick={(e) => handleMarkLearned(false, e)}
            disabled={isPending}
            className="h-16 rounded-2xl bg-white border-2 border-neutral-100 text-neutral-400 font-bold text-lg shadow-md hover:bg-neutral-50 hover:border-neutral-200 hover:text-neutral-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>לא יודע</span>
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => handleMarkLearned(true, e)}
            disabled={isPending}
            className="h-16 rounded-2xl bg-success-500 text-white font-black text-xl shadow-lg shadow-success-200 transition-all duration-200 hover:bg-success-600 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 tracking-tight"
          >
            <span>יודע!</span>
            <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
