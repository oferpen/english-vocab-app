'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Book, Pencil } from 'lucide-react';
import Quiz from './Quiz';
import LearnToday from './LearnToday';
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

  const handleModeSwitch = (newMode: 'learn' | 'quiz') => {
    if (mode === newMode || isSwitching) return;

    setIsSwitching(true);
    setMode(newMode);

    // Don't sync URL at all during mode switch - keep it purely client-side
    // This prevents Next.js from detecting URL changes and causing reload
    setTimeout(() => {
      setIsSwitching(false);
    }, 100);
  };

  // Render based on mode
  // Level 1 logic: Show Letters Learn/Quiz if no category/todayPlan
  if (level === 1 && !category && !todayPlan) {
    return (
      <>
        <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-6 mt-4 sm:mt-0 flex gap-1.5 sm:gap-2 md:gap-3 glass-card rounded-lg sm:rounded-xl md:rounded-2xl p-1 sm:p-1.5 md:p-2 border-white/20">
          <button
            onClick={() => handleModeSwitch('learn')}
            disabled={isSwitching || isPending || mode === 'learn'}
            className={`flex-1 flex items-center justify-center py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2 sm:px-3 md:px-4 lg:px-6 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-200 ${mode === 'learn'
              ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            <Book className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-1 sm:mr-1.5 md:mr-2 lg:mr-3" />
            <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">למידה</span>
          </button>
          <button
            onClick={() => handleModeSwitch('quiz')}
            disabled={isSwitching || isPending || mode === 'quiz'}
            className={`flex-1 flex items-center justify-center py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2 sm:px-3 md:px-4 lg:px-6 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-200 ${mode === 'quiz'
              ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            <Pencil className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-1 sm:mr-1.5 md:mr-2 lg:mr-3" />
            <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">חידון</span>
          </button>
        </div>

        {/* Keep both components mounted but hidden to prevent reload on mode switch */}
        <div style={{ display: mode === 'quiz' ? 'block' : 'none' }}>
          <QuizLetters userId={userId} onModeSwitch={handleModeSwitch} />
        </div>
        <div style={{ display: mode === 'learn' ? 'block' : 'none' }}>
          <LearnToday userId={userId} letterId={letterId} level={1} />
        </div>
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
      <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-6 flex gap-1.5 sm:gap-2 md:gap-3 glass-card rounded-lg sm:rounded-xl md:rounded-2xl p-1 sm:p-1.5 md:p-2 border-white/20">
        <button
          onClick={() => handleModeSwitch('learn')}
          disabled={isSwitching || isPending || mode === 'learn'}
          className={`flex-1 flex items-center justify-center py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2 sm:px-3 md:px-4 lg:px-6 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-200 ${mode === 'learn'
            ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
            : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <Book className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-1 sm:mr-1.5 md:mr-2 lg:mr-3" />
          <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">למידה</span>
        </button>
        <button
          onClick={() => handleModeSwitch('quiz')}
          disabled={isSwitching || isPending || mode === 'quiz'}
          className={`flex-1 flex items-center justify-center py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-2 sm:px-3 md:px-4 lg:px-6 rounded-md sm:rounded-lg md:rounded-xl transition-all duration-200 ${mode === 'quiz'
            ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
            : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <Pencil className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 mr-1 sm:mr-1.5 md:mr-2 lg:mr-3" />
          <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold">חידון</span>
        </button>
      </div>

      {/* Keep both components mounted but hidden to prevent reload on mode switch */}
      <div style={{ display: mode === 'quiz' ? 'block' : 'none' }}>
        <Quiz
          userId={userId}
          todayPlan={todayPlan}
          category={category}
          levelState={levelState}
          categoryWords={categoryWords}
          onModeSwitch={handleModeSwitch}
        />
      </div>
      <div style={{ display: mode === 'learn' ? 'block' : 'none' }}>
        <LearnToday
          userId={userId}
          todayPlan={todayPlan}
          wordId={wordId}
          category={category}
          level={level}
          onModeSwitch={handleModeSwitch}
          currentMode={mode}
        />
      </div>
    </>
  );
}
