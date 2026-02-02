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
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in text-center relative">
        <div className="absolute top-20 -left-20 w-64 h-64 bg-primary-600/30 rounded-full blur-[100px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-20 -right-20 w-80 h-80 bg-purple-600/30 rounded-full blur-[120px] animate-blob delay-2000 mix-blend-screen" />

        {/* Progress Header */}
        <div className="mb-10 flex items-center justify-between glass-premium px-8 py-4 rounded-[2rem] shadow-2xl glow-primary border-white/30">
          <div className="text-lg font-black text-white/70 tracking-widest uppercase">
            {currentIndex + 1} / {letters.length}
          </div>
          <div className="flex-1 mx-8 bg-white/10 rounded-full h-4 overflow-hidden border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-primary-400 via-purple-400 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-2xl font-black text-white">{Math.round(progress)}%</div>
        </div>

        {/* Flashcard (3D Tilt Effect) */}
        <div
          className="relative perspective-2000 group mb-12"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="glass-premium rounded-[4rem] p-16 md:p-24 text-center border-white/30 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            <h2 className="text-[12rem] md:text-[15rem] font-black text-white mb-8 tracking-tighter drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] text-shimmer">
              {letter.letter}
            </h2>
            <div className="space-y-4 mb-12">
              <p className="text-6xl md:text-8xl font-black text-primary-200 tracking-tight drop-shadow-xl">
                {letter.name}
              </p>
              {letter.hebrewName && (
                <p className="text-4xl md:text-5xl font-bold text-white/50">{letter.hebrewName}</p>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => speakLetter(letter.letter)}
                className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-br from-primary-400 to-purple-600 text-white flex items-center justify-center shadow-[0_20px_50px_-10px_rgba(14,165,233,0.5)] hover:scale-110 hover:rotate-6 active:scale-95 transition-all group"
              >
                <Volume2 className="w-14 h-14 group-hover:animate-pulse" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-8 pt-4 pb-16">
          <button
            onClick={(e) => handleMarkLearned(false, e)}
            disabled={isPending}
            className="h-24 rounded-[2rem] glass-premium text-white/50 border-white/10 font-black text-2xl shadow-2xl hover:bg-white/10 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>לא בטוח</span>
          </button>
          <button
            onClick={(e) => handleMarkLearned(true, e)}
            disabled={isPending}
            className="h-24 rounded-[2rem] bg-gradient-to-r from-success-400 to-emerald-600 text-white font-black text-3xl shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] glow-primary border border-white/20"
          >
            יודע! ✨
          </button>
        </div>
      </div>
    </>
  );
}
