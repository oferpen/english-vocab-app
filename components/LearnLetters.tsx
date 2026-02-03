'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const router = useRouter();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: y * -10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    loadLetters();
  }, [userId, letterId]);

  const loadLetters = async () => {
    try {
      setLoading(true);
      if (letterId) {
        const allLetters = await getAllLetters();
        const letterIndex = allLetters.findIndex((l: any) => l.id === letterId);
        if (letterIndex >= 0) {
          setLetters(allLetters);
          setCurrentIndex(letterIndex);
        } else {
          const unmastered = await getUnmasteredLetters(userId);
          setLetters(unmastered);
        }
      } else {
        const unmastered = await getUnmasteredLetters(userId);
        if (unmastered.length === 0) {
          setCompleted(true);
        } else {
          setLetters(unmastered);
        }
      }
    } catch (error: any) {
      setLetters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkLearned = async (correct: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const letter = letters[currentIndex];
    const currentIdx = currentIndex;

    if (currentIdx < letters.length - 1) {
      setCurrentIndex(currentIdx + 1);
    }

    startTransition(async () => {
      await markLetterSeen(userId, letter.id, correct);
      if (correct) {
        playSuccessSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);
      }
      if (currentIdx >= letters.length - 1) {
        const { checkLevel1Complete } = await import('@/app/actions/letters');
        const level1Complete = await checkLevel1Complete(userId);
        if (level1Complete) {
          const { checkAndUnlockLevel2 } = await import('@/app/actions/levels');
          await checkAndUnlockLevel2(userId);
          await addXP(userId, 50);
          setShowCelebration(true);
        } else {
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
      <div className="p-8 text-center glass-premium rounded-3xl max-w-2xl mx-auto mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto"></div>
        <p className="text-xl text-white font-black mt-4">טוען אותיות...</p>
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
          onAction={() => router.push('/learn/path')}
          onClose={() => router.push('/learn/path')}
        />
      </>
    );
  }

  if (letters.length === 0) {
    return (
      <div className="p-10 text-center glass-premium rounded-3xl max-w-2xl mx-auto mt-20">
        <p className="text-2xl text-white font-black mb-6">סיימת את כל האותיות להיום!</p>
        <button onClick={() => router.push('/learn/path')} className="bg-primary-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg glow-primary">חזור למפה</button>
      </div>
    );
  }

  const letter = letters[currentIndex];
  const progress = ((currentIndex + 1) / letters.length) * 100;

  return (
    <>
      <Confetti trigger={showConfetti} duration={1500} />
      <div className="px-2 pt-4 pb-16 sm:p-4 md:p-8 animate-fade-in flex flex-col w-full max-w-sm sm:max-w-2xl md:max-w-4xl mx-auto relative overflow-hidden justify-start sm:justify-center">
        {/* Saturated Neon Accents */}
        <div className="absolute top-20 -left-20 w-64 h-64 bg-primary-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-purple-600/30 rounded-full blur-[120px] animate-blob delay-2000 mix-blend-screen" />

        {/* Letter Counter */}
        <div className="mb-2 sm:mb-1.5 md:mb-2 lg:mb-3 text-center">
          <span className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-white/80">
            אות {currentIndex + 1} מתוך {letters.length}
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
                {letter.letter}
              </h2>
              <p className="text-lg sm:text-sm md:text-base lg:text-xl xl:text-3xl font-bold text-primary-200 mb-3 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 drop-shadow-sm" dir="ltr">
                {letter.name}
              </p>
              {letter.hebrewName && (
                <p className="text-lg sm:text-sm md:text-base lg:text-xl xl:text-3xl font-bold text-white/50 mb-3 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4 drop-shadow-sm" dir="rtl">
                  {letter.hebrewName}
                </p>
              )}
              <div className="flex justify-center mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 xl:mb-4">
                <button
                  onClick={() => speakLetter(letter.letter)}
                  className="w-16 h-16 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-xl sm:rounded-lg md:rounded-xl lg:rounded-2xl xl:rounded-3xl bg-gradient-to-br from-primary-400 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all group"
                >
                  <Volume2 className="w-8 h-8 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-9 xl:h-9 group-hover:animate-pulse" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-1.5 sm:gap-2 md:gap-3 lg:gap-6 items-center justify-between mt-12 sm:mt-2 md:mt-3 lg:mt-4 relative z-10">
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14"></div>
          <button
            onClick={(e) => handleMarkLearned(true, e)}
            disabled={isPending}
            className="flex-1 h-9 sm:h-10 md:h-12 lg:h-14 xl:h-16 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-[2rem] text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-black text-white bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 shadow-[0_15px_40px_-10px_rgba(236,72,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 xl:gap-4 glow-primary"
          >
            המשך ✨
          </button>
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14"></div>
        </div>
      </div>
    </>
  );
}
