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
        <div className="mb-10 flex gap-4 glass-premium rounded-[2.5rem] p-4 shadow-2xl border-white/30 glow-primary">
          <button
            onClick={() => handleModeSwitch('learn')}
            disabled={isSwitching || isPending || mode === 'learn'}
            className={`flex-1 flex items-center justify-center py-5 px-8 rounded-3xl transition-all duration-500 ${mode === 'learn'
              ? 'bg-gradient-to-br from-primary-400 via-primary-500 to-purple-600 text-white font-black shadow-[0_15px_30px_-5px_rgba(14,165,233,0.5)] scale-[1.05] glow-primary'
              : 'hover:bg-white/20 text-neutral-800 font-bold'
              }`}
          >
            <span className="text-4xl mr-3 filter drop-shadow-lg group-hover:animate-bounce">📖</span>
            <span className={`text-2xl font-black ${mode === 'learn' ? 'text-shimmer drop-shadow-md' : ''}`}>למידה</span>
          </button>
          <button
            onClick={() => handleModeSwitch('quiz')}
            disabled={isSwitching || isPending || mode === 'quiz'}
            className={`flex-1 flex items-center justify-center py-5 px-8 rounded-3xl transition-all duration-500 ${mode === 'quiz'
              ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white font-black shadow-[0_15px_30px_-5px_rgba(236,72,153,0.5)] scale-[1.05] glow-accent'
              : 'hover:bg-white/20 text-neutral-800 font-bold'
              }`}
          >
            <span className="text-4xl mr-3 filter drop-shadow-lg group-hover:animate-bounce">⚡</span>
            <span className={`text-2xl font-black ${mode === 'quiz' ? 'text-shimmer drop-shadow-md' : ''}`}>חידון</span>
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
      <div className="mb-6 flex gap-3 glass-card rounded-2xl p-2.5 border-white/20">
        <button
          onClick={() => handleModeSwitch('learn')}
          disabled={isSwitching || isPending || mode === 'learn'}
          className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl transition-all duration-200 ${mode === 'learn'
            ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
            : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <span className="text-3xl mr-3">📖</span>
          <span className="text-lg font-bold">למידה</span>
        </button>
        <button
          onClick={() => handleModeSwitch('quiz')}
          disabled={isSwitching || isPending || mode === 'quiz'}
          className={`flex-1 flex items-center justify-center py-4 px-6 rounded-xl transition-all duration-200 ${mode === 'quiz'
            ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
            : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <span className="text-3xl mr-3">✏️</span>
          <span className="text-lg font-bold">חידון</span>
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
