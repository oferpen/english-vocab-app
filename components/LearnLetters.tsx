'use client';

import { useState, useEffect, useTransition } from 'react';
import { markLetterSeen, getAllLetters, getUnmasteredLetters } from '@/app/actions/letters';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound } from '@/lib/sounds';

interface LearnLettersProps {
  childId: string;
  letterId?: string;
}

export default function LearnLetters({ childId, letterId }: LearnLettersProps) {
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
  }, [childId, letterId]);

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
            getUnmasteredLetters(childId),
            timeoutPromise
          ]) as any[];
          setLetters(unmastered);
        }
      } else {
        const unmastered = await Promise.race([
          getUnmasteredLetters(childId),
          timeoutPromise
        ]) as any[];
        
        if (unmastered.length === 0) {
          // All letters mastered, check if can advance to level 2
          const { checkLevel1Complete } = await import('@/app/actions/letters');
          const level1Complete = await Promise.race([
            checkLevel1Complete(childId),
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
      await markLetterSeen(childId, letter.id, correct);
      
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
        const level1Complete = await checkLevel1Complete(childId);
        
        if (level1Complete) {
          // Unlock level 2
          const { checkAndUnlockLevel2 } = await import('@/app/actions/levels');
          await checkAndUnlockLevel2(childId);
          await addXP(childId, 50); // Award XP for completing level 1
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
          title="כל הכבוד! 🎉"
          message="סיימת ללמוד את כל האותיות! עכשיו אתה יכול להתחיל ללמוד מילים!"
          emoji="⭐"
          showConfetti={showCelebration}
          actionLabel="המשך למילים →"
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
      <div className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-200px)] animate-fade-in">
        {/* Progress Bar */}
        <div className="mb-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-base font-semibold text-gray-700">
              {currentIndex + 1} מתוך {letters.length}
            </span>
            <span className="text-base font-bold text-primary-600">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Letter Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-6 border border-gray-100 animate-slide-up">
          <div className="text-center">
            <h2 className="text-8xl md:text-9xl font-bold mb-8 text-primary-600 drop-shadow-lg">
              {letter.letter}
            </h2>
            <p className="text-3xl md:text-4xl mb-4 text-gray-800 font-semibold">
              {letter.name}
            </p>
            {letter.hebrewName && (
              <p className="text-2xl md:text-3xl mb-6 text-gray-600">
                {letter.hebrewName}
              </p>
            )}
            {letter.sound && (
              <div className="mt-6 p-5 bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 rounded-xl border border-primary-100 shadow-sm">
                <p className="text-xl md:text-2xl text-gray-700 font-medium">
                  הגייה: {letter.sound}
                </p>
              </div>
            )}

            <button
              onClick={() => speakLetter(letter.letter)}
              className="mt-8 text-6xl md:text-7xl hover:scale-110 active:scale-95 transition-all duration-200 hover:drop-shadow-lg"
              aria-label="השמע הגייה"
            >
              🔊
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={(e) => handleMarkLearned(false, e)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-5 md:py-6 rounded-xl text-lg md:text-xl font-bold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            לא יודע ❌
          </button>
          <button
            type="button"
            onClick={(e) => handleMarkLearned(true, e)}
            className="bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white py-5 md:py-6 rounded-xl text-lg md:text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            יודע! ✓
          </button>
        </div>
      </div>
    </>
  );
}
