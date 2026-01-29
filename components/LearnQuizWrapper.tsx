'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import QuizToday from './QuizToday';
import LearnToday from './LearnToday';
import LearnLetters from './LearnLetters';

interface LearnQuizWrapperProps {
  childId: string;
  todayPlan: any;
  category?: string;
  level?: number;
  wordId?: string;
  letterId?: string;
  levelState: any;
  categoryWords?: any[]; // Pass categoryWords to avoid fetching them again
}

export default function LearnQuizWrapper({
  childId,
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

  // Sync mode with URL params
  useEffect(() => {
    const urlMode = searchParams?.get('mode') as 'learn' | 'quiz';
    if (urlMode && urlMode !== mode && !isSwitching) {
      setMode(urlMode);
    }
  }, [searchParams, mode, isSwitching]);

  const handleModeSwitch = (newMode: 'learn' | 'quiz') => {
    if (mode === newMode || isSwitching || isPending) return;

    setIsSwitching(true);
    setMode(newMode);

    // Update URL using router.replace to keep useSearchParams in sync
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('mode', newMode);

    startTransition(() => {
      router.replace(`/learn?${params.toString()}`, { scroll: false });
      // Reset switching flag after transition completes
      setIsSwitching(false);
    });
  };

  // Render based on mode - keep components mounted to preserve state
  // Only show letters for level 1 if no category is provided
  // If category is provided (e.g., Starter), show words even for level 1 users
  if (levelState.level === 1 && !category && !todayPlan) {
    return (
      <>
        <LearnLetters childId={childId} letterId={letterId} />
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
      <div className="mb-4 flex gap-2 bg-white rounded-xl p-2 shadow-md border border-gray-100">
        <button
          onClick={() => handleModeSwitch('learn')}
          disabled={isSwitching || isPending || mode === 'learn'}
          className={`flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-200 ${mode === 'learn'
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
          className={`flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-200 ${mode === 'quiz'
              ? 'border-2 border-primary-500 text-primary-600 font-bold'
              : 'hover:bg-purple-50 text-gray-600 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <span className="text-2xl mb-1">✏️</span>
          <span className="text-sm font-semibold">חידון</span>
        </button>
      </div>

      <div className={mode === 'quiz' ? 'block' : 'hidden'}>
        <QuizToday
          childId={childId}
          todayPlan={todayPlan}
          category={category}
          levelState={levelState}
          categoryWords={categoryWords}
          onModeSwitch={handleModeSwitch}
        />
      </div>
      <div className={mode === 'learn' ? 'block' : 'hidden'}>
        <LearnToday
          childId={childId}
          todayPlan={todayPlan}
          wordId={wordId}
          category={category}
          level={level}
          onModeSwitch={handleModeSwitch}
          currentMode={mode} // Pass mode as prop for reliable detection
        />
      </div>
    </>
  );
}
