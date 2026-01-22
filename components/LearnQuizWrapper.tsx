'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const [mode, setMode] = useState<'learn' | 'quiz'>(() => {
    return (searchParams?.get('mode') as 'learn' | 'quiz') || 'learn';
  });

  // Sync mode with URL params
  useEffect(() => {
    const urlMode = searchParams?.get('mode') as 'learn' | 'quiz';
    if (urlMode && urlMode !== mode) {
      setMode(urlMode);
    }
  }, [searchParams, mode]);

  const handleModeSwitch = (newMode: 'learn' | 'quiz') => {
    if (mode === newMode) return;
    setMode(newMode);
    // Update URL without triggering server re-render using history API
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('mode', newMode);
    const newUrl = `/learn?${params.toString()}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  };

  // Render based on mode - keep components mounted to preserve state
  if (levelState.level === 1) {
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
        />
      </div>
    </>
  );
}
