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
    
    // Use window.history.replaceState to update URL without triggering server re-render
    // This prevents RSC requests and page reloads
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('mode', newMode);
    const newUrl = `/learn?${params.toString()}`;
    
    // Update URL without triggering Next.js navigation
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        { ...window.history.state, as: newUrl, url: newUrl },
        '',
        newUrl
      );
    }
    
    // Reset switching flag after a short delay
    setTimeout(() => setIsSwitching(false), 100);
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
