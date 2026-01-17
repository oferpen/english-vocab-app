'use client';

import { useState, useEffect } from 'react';
import { markWordSeen } from '@/app/actions/progress';
import { updateMissionProgress } from '@/app/actions/missions';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound } from '@/lib/sounds';

interface LearnTodayProps {
  childId: string;
  todayPlan: any;
}

export default function LearnToday({ childId, todayPlan }: LearnTodayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const router = useRouter();

  const words = todayPlan?.words?.map((w: any) => w.word) || [];

  useEffect(() => {
    if (words.length === 0) {
      setCompleted(true);
    }
  }, [words.length]);

  const handleMarkLearned = async () => {
    const word = words[currentIndex];
    await markWordSeen(childId, word.id);
    
    // Play success sound
    playSuccessSound();
    
    if (currentIndex < words.length - 1) {
      // Show small celebration for each word
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
      setCurrentIndex(currentIndex + 1);
    } else {
      // Show big celebration for completion
      const xp = words.length * 5;
      setXpGained(xp);
      setShowCelebration(true);
      await updateMissionProgress(childId, 'DAILY', 'learn_words', words.length, 1);
      await addXP(childId, xp);
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

  if (completed || showCelebration) {
    return (
      <>
        <Confetti trigger={showCelebration} />
        <CelebrationScreen
          title="כל הכבוד! 🎉"
          message={`סיימת ללמוד ${words.length} מילים היום! קיבלת ${xpGained} נקודות XP!`}
          emoji="⭐"
          showConfetti={showCelebration}
          actionLabel="המשך לחידון →"
          onAction={() => {
            setShowCelebration(false);
            setCompleted(true);
            router.push('/quiz');
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
      <Confetti trigger={showConfetti} duration={1500} />
      <div className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-200px)] animate-fade-in">
        {/* Progress Bar */}
      <div className="mb-6 bg-white rounded-xl p-5 shadow-md border border-gray-100 animate-slide-up">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-semibold text-gray-700">
            {currentIndex + 1} מתוך {words.length}
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

      {/* Action Button */}
      <button
        onClick={handleMarkLearned}
        className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white py-5 md:py-6 rounded-xl text-xl md:text-2xl font-bold shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
      >
        למדתי ✓
      </button>
      </div>
    </>
  );
}
