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
    <div className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-200px)]">
      {/* Progress Bar */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {currentIndex + 1} מתוך {words.length}
          </span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Word Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-6 text-blue-600">{word.englishWord}</h2>
          <p className="text-3xl mb-6 text-gray-800 font-medium">{word.hebrewTranslation}</p>
          
          {word.exampleEn && (
            <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <p className="text-lg text-gray-800 mb-2 font-medium">{word.exampleEn}</p>
              <p className="text-lg text-gray-600">{word.exampleHe}</p>
            </div>
          )}

          <button
            onClick={() => speakWord(word.englishWord)}
            className="mt-6 text-5xl hover:scale-110 active:scale-95 transition-transform"
            aria-label="השמע הגייה"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleMarkLearned}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-5 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
      >
        למדתי ✓
      </button>
    </div>
  );
}
