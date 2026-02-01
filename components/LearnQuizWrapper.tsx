'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QuizToday from './QuizToday';
import LearnToday from './LearnToday';
import LearnLetters from './LearnLetters';
import QuizLetters from './QuizLetters';

interface LearnQuizWrapperProps {
  userId: string;
  todayPlan: any;
  category?: string;
  level?: number;
  wordId?: string;
  letterId?: string;
  levelState: any;
  categoryWords?: any[]; // Pass categoryWords to avoid fetching them again
}

export default function LearnQuizWrapper({
  userId,
  todayPlan,
  category,
  level,
  wordId,
  letterId,
  levelState,
  categoryWords,
}: LearnQuizWrapperProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'learn' | 'quiz'>(() => {
    return (searchParams?.get('mode') as 'learn' | 'quiz') || 'learn';
  });
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    // Sync mode to URL without full page reload
    const url = new URL(window.location.href);
    if (url.searchParams.get('mode') !== mode) {
      url.searchParams.set('mode', mode);
      window.history.replaceState(null, '', url.toString());
    }
  }, [mode]);

  const handleModeSwitch = (newMode: 'learn' | 'quiz') => {
    if (mode === newMode || isSwitching) return;

    setIsSwitching(true);
    setMode(newMode);

    // Small delay to ensure smooth transition
    setTimeout(() => {
      setIsSwitching(false);
    }, 100);
  };

  // Render based on mode
  // Level 1 logic: Show Letters Learn/Quiz if no category/todayPlan
  if (level === 1 && !category && !todayPlan) {
    return (
      <>
        <div className="mb-2 flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
          <button
            onClick={() => handleModeSwitch('learn')}
            disabled={isSwitching || isPending || mode === 'learn'}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${mode === 'learn'
              ? 'border-2 border-primary-500 text-primary-600 font-bold shadow-sm'
              : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600'
              }`}
          >
            <span className="text-xl mr-2">📖</span>
            <span className="text-sm font-semibold">למידה</span>
          </button>
          <button
            onClick={() => handleModeSwitch('quiz')}
            disabled={isSwitching || isPending || mode === 'quiz'}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${mode === 'quiz'
              ? 'border-2 border-primary-500 text-primary-600 font-bold shadow-sm'
              : 'hover:bg-purple-50 text-gray-600 hover:text-purple-600'
              }`}
          >
            <span className="text-2xl mb-1">✏️</span>
            <span className="text-sm font-semibold">חידון</span>
          </button>
        </div>

        {mode === 'quiz' ? (
          <QuizLetters userId={userId} onModeSwitch={handleModeSwitch} />
        ) : (
          <LearnLetters userId={userId} letterId={letterId} />
        )}
      </>
    );
  }

  if (!todayPlan) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600">טוען מילים...</p>
      </div>
    );
  }

  // Keep both components mounted but show/hide based on mode to preserve state
  return (
    <>
      {/* Navigation Tabs - Always visible to prevent flickering */}
      <div className="mb-2 flex gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
        <button
          onClick={() => handleModeSwitch('learn')}
          disabled={isSwitching || isPending || mode === 'learn'}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${mode === 'learn'
            ? 'border-2 border-primary-500 text-primary-600 font-bold'
            : 'hover:bg-blue-50 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <span className="text-2xl mb-1">📖</span>
          <span className="text-sm font-semibold">למידה</span>
        </button>
        <button
          onClick={() => handleModeSwitch('quiz')}
          disabled={isSwitching || isPending || mode === 'quiz'}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${mode === 'quiz'
            ? 'border-2 border-primary-500 text-primary-600 font-bold'
            : 'hover:bg-purple-50 text-gray-600 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <span className="text-2xl mb-1">✏️</span>
          <span className="text-sm font-semibold">חידון</span>
        </button>
      </div>

      {mode === 'quiz' ? (
        <QuizToday
          userId={userId}
          todayPlan={todayPlan}
          category={category}
          levelState={levelState}
          categoryWords={categoryWords}
          onModeSwitch={handleModeSwitch}
        />
      ) : (
        <LearnToday
          userId={userId}
          todayPlan={todayPlan}
          wordId={wordId}
          category={category}
          level={level}
          onModeSwitch={handleModeSwitch}
          currentMode={mode}
        />
      )}
    </>
  );
}
