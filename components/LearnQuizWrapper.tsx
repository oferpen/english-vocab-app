'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Book, Pencil } from 'lucide-react';
import Quiz from './Quiz';
import LearnToday from './LearnToday';

interface LearnQuizWrapperProps {
  userId: string;
  todayPlan: any;
  category?: string;
  level?: number;
  wordId?: string;
  letterId?: string;
  levelState: any;
  categoryWords?: any[]; // Pass categoryWords to avoid fetching them again
  settings?: any; // Pass settings to avoid client-side server action call
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
  settings,
}: LearnQuizWrapperProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'learn' | 'quiz'>(() => {
    return (searchParams?.get('mode') as 'learn' | 'quiz') || 'learn';
  });
  const [isSwitching, setIsSwitching] = useState(false);

  // Sync mode from URL params when they change (e.g., on page refresh or navigation)
  useEffect(() => {
    const urlMode = searchParams?.get('mode') as 'learn' | 'quiz';
    if (urlMode && urlMode !== mode) {
      setMode(urlMode);
    }
  }, [searchParams, mode]);

  const handleModeSwitch = (newMode: 'learn' | 'quiz') => {
    if (mode === newMode || isSwitching) return;

    setIsSwitching(true);
    setMode(newMode);

    // Update URL to persist mode across page refreshes
    const params = new URLSearchParams(window.location.search);
    params.set('mode', newMode);
    startTransition(() => {
      router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
      setTimeout(() => {
        setIsSwitching(false);
      }, 100);
    });
  };

  // Render based on mode
  // Level 1 logic: Show Letters Learn/Quiz if no category/todayPlan
  if (level === 1 && !category && !todayPlan) {
    return (
      <div className="flex flex-col h-full" style={{ gap: '0' }}>
        {/* Navigation Tabs */}
        <div className="flex gap-2 glass-card rounded-xl border-white/20 flex-shrink-0" style={{ marginBottom: '12px', paddingTop: '6px', paddingLeft: '6px', paddingRight: '6px', paddingBottom: '6px' }}>
          <button
            onClick={() => handleModeSwitch('learn')}
            disabled={isSwitching || isPending || mode === 'learn'}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${mode === 'learn'
              ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            <Book className="w-4 h-4 mr-1.5" />
            <span className="text-sm font-bold">למידה</span>
          </button>
          <button
            onClick={() => handleModeSwitch('quiz')}
            disabled={isSwitching || isPending || mode === 'quiz'}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${mode === 'quiz'
              ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            <Pencil className="w-4 h-4 mr-1.5" />
            <span className="text-sm font-bold">חידון</span>
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0" style={{ flex: '1 1 auto', height: '0' }}>
          <div style={{ display: mode === 'quiz' ? 'block' : 'none', height: '100%' }}>
            <Quiz userId={userId} level={1} onModeSwitch={handleModeSwitch} />
          </div>
          <div style={{ display: mode === 'learn' ? 'block' : 'none', height: '100%' }}>
            <LearnToday userId={userId} letterId={letterId} level={1} />
          </div>
        </div>
      </div>
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
      <div className="flex flex-col h-full" style={{ gap: '0' }}>
        {/* Navigation Tabs */}
        <div className="flex gap-2 glass-card rounded-xl border-white/20 flex-shrink-0" style={{ marginBottom: '12px', paddingTop: '6px', paddingLeft: '6px', paddingRight: '6px', paddingBottom: '6px' }}>
        <button
          onClick={() => handleModeSwitch('learn')}
          disabled={isSwitching || isPending || mode === 'learn'}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${mode === 'learn'
            ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
            : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <Book className="w-4 h-4 mr-1.5" />
          <span className="text-sm font-bold">למידה</span>
        </button>
        <button
          onClick={() => handleModeSwitch('quiz')}
          disabled={isSwitching || isPending || mode === 'quiz'}
          className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${mode === 'quiz'
            ? 'border-2 border-primary-400 text-white font-black shadow-sm bg-primary-500/30 backdrop-blur-sm'
            : 'text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
        >
          <Pencil className="w-4 h-4 mr-1.5" />
          <span className="text-sm font-bold">חידון</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <div style={{ display: mode === 'quiz' ? 'block' : 'none', height: '100%' }}>
          <Quiz
            userId={userId}
            todayPlan={todayPlan}
            category={category}
            levelState={levelState}
            categoryWords={categoryWords}
            settings={settings}
            onModeSwitch={handleModeSwitch}
          />
        </div>
        <div style={{ display: mode === 'learn' ? 'block' : 'none', height: '100%' }}>
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
      </div>
    </div>
  );
}
