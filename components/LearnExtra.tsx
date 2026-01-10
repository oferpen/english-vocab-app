'use client';

import { useState, useEffect } from 'react';
import { getUnseenWords, getWordsNeedingReview } from '@/app/actions/progress';
import { getSettings } from '@/app/actions/settings';
import { markWordSeen } from '@/app/actions/progress';
import { useRouter } from 'next/navigation';

interface LearnExtraProps {
  childId: string;
}

export default function LearnExtra({ childId }: LearnExtraProps) {
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<'unseen' | 'needsReview' | 'nextPlanned'>('unseen');
  const router = useRouter();

  useEffect(() => {
    loadWords();
  }, [childId, strategy]);

  const loadWords = async () => {
    setLoading(true);
    const settings = await getSettings();
    const selectedStrategy = strategy || settings.extraLearningStrategy;

    let wordList: any[] = [];
    if (selectedStrategy === 'unseen') {
      wordList = await getUnseenWords(childId);
    } else if (selectedStrategy === 'needsReview') {
      const progressList = await getWordsNeedingReview(childId);
      wordList = progressList.map((p) => p.word);
    }

    setWords(wordList);
    setCurrentIndex(0);
    setLoading(false);
  };

  const handleNext = async () => {
    if (currentIndex < words.length - 1) {
      const word = words[currentIndex];
      await markWordSeen(childId, word.id);
      setCurrentIndex(currentIndex + 1);
    } else {
      const word = words[currentIndex];
      await markWordSeen(childId, word.id);
      router.push('/progress');
    }
  };

  const handleMarkLearned = async () => {
    const word = words[currentIndex];
    await markWordSeen(childId, word.id);
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/progress');
    }
  };

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">טוען...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">אסטרטגיית למידה:</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as any)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="unseen">מילים שלא נראו</option>
            <option value="needsReview">צריך חיזוק</option>
          </select>
        </div>
        <div className="text-center p-8">
          <p className="text-xl text-gray-600">אין מילים זמינות</p>
        </div>
      </div>
    );
  }

  const word = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">אסטרטגיית למידה:</label>
        <select
          value={strategy}
          onChange={(e) => {
            setStrategy(e.target.value as any);
            loadWords();
          }}
          className="w-full p-2 border rounded-lg mb-2"
        >
          <option value="unseen">מילים שלא נראו</option>
          <option value="needsReview">צריך חיזוק</option>
        </select>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{currentIndex + 1} מתוך {words.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4 text-green-600">{word.englishWord}</h2>
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

      <div className="flex gap-3">
        <button
          onClick={handleNext}
          className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-lg text-lg font-medium"
        >
          הבא
        </button>
        <button
          onClick={handleMarkLearned}
          className="flex-1 bg-green-600 text-white py-4 rounded-lg text-lg font-medium"
        >
          למדתי ✓
        </button>
      </div>
    </div>
  );
}
