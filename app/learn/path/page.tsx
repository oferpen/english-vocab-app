import { getCurrentUser } from '@/lib/auth';
import { getLevelState } from '@/app/actions/levels';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getAllWords } from '@/app/actions/words';
import { getAllLetters, getAllLetterProgress } from '@/app/actions/letters';
import LearnPath from '@/components/LearnPath';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import ModernNavBar from '@/components/ModernNavBar';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Allow caching but still be dynamic

// Disable React Strict Mode for this page to prevent double renders
export const experimental_ppr = false;

export default async function LearnPathPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return <GoogleSignIn />;
    }

    // Fetch all data server-side to avoid duplicate HTTP requests from client components
    let levelState;
    let progress: any[] = [];
    let streak = 0;
    let allWords: any[] = [];

    try {
      levelState = await getLevelState(user.id);
    } catch (error: any) {
      // Default to level 1 if there's an error
      levelState = { level: 1, xp: 0, id: '', userId: user.id, updatedAt: new Date() };
    }

    try {
      // Fetch progress, streak, all words, letters and letter progress in parallel
      const [
        progressRes,
        streakRes,
        allWordsRes,
        lettersRes,
        letterProgressRes
      ] = await Promise.all([
        getAllProgress(user.id),
        getStreak(user.id),
        getAllWords(),
        getAllLetters(),
        getAllLetterProgress(user.id),
      ]);

      progress = progressRes;
      streak = streakRes;
      allWords = allWordsRes;
      const letters = lettersRes;
      const letterProgress = letterProgressRes;

      // Debug logging
      const starterWords = allWords.filter((w: any) => (w.category === 'Starter' || w.category?.startsWith('Starter')) && w.level === 1);
      console.log('[LearnPathPage] Fetched data:', {
        progressCount: progress.length,
        streak,
        allWordsCount: allWords.length,
        starterWordsCount: starterWords.length,
      });

      return (
        <div className="min-h-screen bg-neutral-50">
          <ModernNavBar
            name={user.name || 'User'}
            avatar={user.avatar || user.image || '👶'}
            level={levelState.level}
            streak={streak}
            xp={levelState.xp}
          />
          <div className="max-w-2xl mx-auto bg-white min-h-screen pt-16 pb-20 md:pb-8 shadow-sm">
            <LearnPath
              userId={user.id}
              levelState={levelState}
              progress={progress}
              allWords={allWords}
              letters={letters}
              letterProgress={letterProgress}
            />
          </div>
        </div>
      );
    } catch (innerError) {
      console.error('Error fetching data in LearnPathPage:', innerError);
      throw innerError;
    }
  } catch (error: any) {
    if (error?.message?.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Error in LearnPathPage:', error);
    return <GoogleSignIn />;
  }
}
