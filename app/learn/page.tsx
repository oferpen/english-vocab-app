import { getCurrentChild } from '@/lib/auth-nextauth';
import { getLevelState } from '@/app/actions/levels';
import { getWordsByCategory } from '@/app/actions/words';
import { getStreak } from '@/app/actions/streak';
import { getTodayDate } from '@/lib/utils';
import LearnLetters from '@/components/LearnLetters';
import LearnQuizWrapper from '@/components/LearnQuizWrapper';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import ModernNavBar from '@/components/ModernNavBar';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// Use revalidate instead of force-dynamic to allow caching
export const revalidate = 0; // Still dynamic but allows better optimization

interface LearnPageProps {
  searchParams: Promise<{
    letterId?: string;
    wordId?: string;
    category?: string;
    level?: string;
    mode?: string; // 'learn' or 'quiz'
  }>;
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const child = await getCurrentChild();

  if (!child) {
    return <GoogleSignIn />;
  }

  const params = await searchParams;
  const letterId = params?.letterId;
  const wordId = params?.wordId;
  const category = params?.category;
  const requestedLevel = params?.level ? parseInt(params.level) : undefined;
  const mode = params?.mode || 'learn';

  // Fetch child's level and streak in parallel
  let levelState;
  let streak = 0;

  try {
    const [levelData, streakData] = await Promise.all([
      getLevelState(child.id).catch(() => ({ level: 1, xp: 0, id: '', childId: child.id, updatedAt: new Date() })),
      getStreak(child.id).catch(() => 0)
    ]);
    levelState = levelData;
    streak = streakData;
  } catch (error) {
    levelState = { level: 1, xp: 0, id: '', childId: child.id, updatedAt: new Date() };
  }

  // If a specific letter is requested, force level 1
  if (letterId) {
    levelState = { level: 1, xp: levelState.xp, id: levelState.id, childId: child.id, updatedAt: levelState.updatedAt };
  }

  // Helper for NavBar to ensure consistency
  const navBar = (
    <ModernNavBar
      childName={child.name}
      avatar={child.avatar || ''}
      level={levelState.level}
      streak={streak}
      xp={levelState.xp}
    />
  );

  const levelTitle = mode === 'quiz' ? 'חידון' : (levelState.level === 1 ? 'ללמוד' : 'ללמוד');

  // Handle quiz mode - Level 1 (letters) doesn't have regular quizzes
  // Exception: Allow if a category (like Starter) is being learned
  if (mode === 'quiz' && levelState.level === 1 && !category) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {navBar}
        <div className="max-w-2xl mx-auto bg-white min-h-screen pt-16 pb-20 md:pb-8 text-center pt-32 px-4 shadow-sm">
          <div className="text-8xl mb-6">📚</div>
          <h2 className="text-3xl font-black mb-4 text-neutral-800 tracking-tight">עדיין לא זמין</h2>
          <p className="text-xl text-neutral-600 mb-8 max-w-md mx-auto">
            סיים ללמוד את כל האותיות כדי לפתוח חידונים!
          </p>
          <a href="/learn" className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-600 hover:scale-105 transition-all inline-block">
            חזור ללמידה
          </a>
        </div>
      </div>
    );
  }

  // Load words for word learning/quiz
  let todayPlan = null;
  let categoryWords: any[] = [];

  if (category) {
    const levelToUse = requestedLevel || levelState.level;

    categoryWords = mode === 'quiz'
      ? await getWordsByCategory(category)
      : await getWordsByCategory(category, levelToUse);

    if (categoryWords.length === 0) {
      return (
        <div className="min-h-screen bg-neutral-50">
          {navBar}
          <div className="max-w-2xl mx-auto bg-white min-h-screen pt-16 pb-20 md:pb-8 text-center pt-32 px-4 shadow-sm">
            <div className="text-8xl mb-6">📭</div>
            <h2 className="text-3xl font-black mb-4 text-neutral-800 tracking-tight">אין מילים בקטגוריה</h2>
            <p className="text-xl text-neutral-600 mb-8">לא נמצאו מילים זמינות ברמה זו.</p>
            <Link href="/learn/path" className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-600">
              חזור לנתיב
            </Link>
          </div>
        </div>
      );
    }

    todayPlan = {
      id: mode === 'quiz' ? `category-${category}` : `category-${category}-level-${levelToUse}`,
      childId: child.id,
      date: getTodayDate(),
      words: categoryWords.map(word => ({ word })),
    };
  } else if (levelState.level >= 2) {
    redirect('/learn/path');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {navBar}
      <div className="max-w-2xl mx-auto bg-white min-h-screen pt-16 pb-20 md:pb-8 shadow-sm">
        <LearnQuizWrapper
          childId={child.id}
          todayPlan={todayPlan}
          category={category}
          level={requestedLevel || levelState.level}
          wordId={wordId}
          letterId={letterId}
          levelState={levelState}
          categoryWords={categoryWords}
        />
      </div>
    </div>
  );
}
