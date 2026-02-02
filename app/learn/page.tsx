import { getCurrentUser } from '@/lib/auth';
import { getLevelState } from '@/app/actions/levels';
import { getWordsByCategory } from '@/app/actions/words';
import { getStreak } from '@/app/actions/streak';
import { getTodayDate } from '@/lib/utils';
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
  const user = await getCurrentUser();

  if (!user) {
    return <GoogleSignIn />;
  }

  const params = await searchParams;
  const letterId = params?.letterId;
  const wordId = params?.wordId;
  const category = params?.category;
  const requestedLevel = params?.level ? parseInt(params.level) : undefined;
  const mode = params?.mode || 'learn';

  // Fetch streak (level/xp are on user object directly)
  let streak = 0;
  try {
    streak = await getStreak(user.id).catch(() => 0);
  } catch (error) {
    console.error('Error fetching streak:', error);
  }

  const levelState = {
    level: user.level,
    xp: user.xp,
    id: user.id, // technically userId, but used as key 
    updatedAt: user.updatedAt
  };

  // If a specific letter is requested, force level 1 for display purposes if needed?
  // Actually, we should just respect the user's level.

  // Helper for NavBar to ensure consistency
  const navBar = (
    <ModernNavBar
      name={user.name || 'Student'}
      avatar={user.avatar || user.image || '🦉'}
      level={user.level}
      streak={streak}
      xp={user.xp}
    />
  );

  // Load words for word learning/quiz
  let todayPlan = null;
  let categoryWords: any[] = [];

  if (category) {
    const levelToUse = requestedLevel || user.level;

    // Fetch category words for the specific level
    categoryWords = await getWordsByCategory(category, levelToUse);

    if (categoryWords.length === 0) {
      return (
        <div className="min-h-screen bg-transparent">
          {navBar}
          <div className="max-w-3xl mx-auto glass-premium min-h-[80vh] mt-24 mb-10 text-center px-8 py-16 rounded-[3rem]">
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

    // Create todayPlan object if category exists
    // ...
    if (category) {
      // ...
      todayPlan = {
        id: mode === 'quiz' ? `category-${category}` : `category-${category}-level-${levelToUse}`,
        userId: user.id, // Using userId
        date: getTodayDate(),
        words: categoryWords.map(word => ({ word })),
      };
    }

    // ...

    return (
      <div className="min-h-screen bg-transparent">
        {navBar}
        <div className="max-w-5xl mx-auto glass-premium min-h-[85vh] mt-28 mb-16 rounded-[4rem] p-8 md:p-16 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)] border-white/20 transition-all duration-1000">
          <LearnQuizWrapper
            userId={user.id}
            todayPlan={todayPlan}
            category={category}
            level={requestedLevel || user.level}
            wordId={wordId}
            letterId={letterId}
            levelState={levelState}
            categoryWords={categoryWords}
          />
        </div>
      </div>
    );
  }

  // If no category selected, check if we should show letters (requested level 1 or user level 1)
  if (!category && (requestedLevel === 1 || user.level >= 1)) {
    return (
      <div className="min-h-screen bg-transparent">
        {navBar}
        <div className="max-w-3xl mx-auto glass-premium min-h-[80vh] mt-24 mb-10 rounded-[3rem] p-6 md:p-10">
          <LearnQuizWrapper
            userId={user.id}
            todayPlan={null}
            category={undefined}
            level={requestedLevel || 1}
            wordId={wordId}
            letterId={letterId}
            levelState={levelState}
          />
        </div>
      </div>
    );
  }

  // If no category selected and not level 1, redirect to path
  redirect('/learn/path');
}
