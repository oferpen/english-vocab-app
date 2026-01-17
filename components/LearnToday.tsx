'use client';

import { useState, useEffect } from 'react';
import { markWordSeen } from '@/app/actions/progress';
import { updateMissionProgress } from '@/app/actions/missions';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';

interface LearnTodayProps {
  childId: string;
  todayPlan: any;
}

export default function LearnToday({ childId, todayPlan }: LearnTodayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
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
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCompleted(true);
      await updateMissionProgress(childId, 'DAILY', 'learn_words', words.length, 1);
      await addXP(childId, words.length * 5);
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

  if (completed) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">⭐</div>
        <h2 className="text-3xl font-bold mb-2">כל הכבוד!</h2>
        <p className="text-xl text-gray-600 mb-6">
          סיימת ללמוד {words.length} מילים היום
        </p>
        <button
          onClick={() => router.push('/quiz')}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium"
        >
          המשך לחידון
        </button>
      </div>
    );
  }

  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{currentIndex + 1} מתוך {words.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 text-blue-600">{word.englishWord}</h2>
          <p className="text-2xl mb-4">{word.hebrewTranslation}</p>
          
          {word.exampleEn && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-700 mb-2">{word.exampleEn}</p>
              <p className="text-lg text-gray-600">{word.exampleHe}</p>
            </div>
          )}

          <button
            onClick={() => speakWord(word.englishWord)}
            className="mt-4 text-4xl hover:scale-110 transition-transform"
            aria-label="השמע הגייה"
          >
            🔊
          </button>
        </div>
      </div>

      <button
        onClick={handleMarkLearned}
        className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-medium"
      >
        למדתי
      </button>
    </div>
  );
}
