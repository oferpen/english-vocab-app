import { getCurrentChild } from '@/lib/auth-nextauth';
import { getLevelState } from '@/app/actions/levels';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getAllWords } from '@/app/actions/words';
import LearnPath from '@/components/LearnPath';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import ModernNavBar from '@/components/ModernNavBar';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Allow caching but still be dynamic

// Disable React Strict Mode for this page to prevent double renders
export const experimental_ppr = false;

export default async function LearnPathPage() {
  try {
    const child = await getCurrentChild();

    if (!child) {
      return <GoogleSignIn />;
    }

    // Fetch all data server-side to avoid duplicate HTTP requests from client components
    let levelState;
    let progress: any[] = [];
    let streak = 0;
    let allWords: any[] = [];

    try {
      levelState = await getLevelState(child.id);
    } catch (error: any) {
      // Default to level 1 if there's an error
      levelState = { level: 1, xp: 0, id: '', childId: child.id, updatedAt: new Date() };
    }

    try {
      // Fetch progress, streak, and all words in parallel
      [progress, streak, allWords] = await Promise.all([
        getAllProgress(child.id),
        getStreak(child.id),
        getAllWords(), // Fetch all words without level filter
      ]);

      // Debug logging
      const starterWords = allWords.filter((w: any) => (w.category === 'Starter' || w.category?.startsWith('Starter')) && w.level === 1);
      console.log('[LearnPathPage] Fetched data:', {
        progressCount: progress.length,
        streak,
        allWordsCount: allWords.length,
        starterWordsCount: starterWords.length,
        sampleStarterWords: starterWords.slice(0, 3).map((w: any) => ({
          word: w.englishWord,
          category: w.category,
          level: w.level
        })),
        allWordsSample: allWords.slice(0, 3).map((w: any) => ({
          word: w.englishWord,
          category: w.category,
          level: w.level,
          hasCategory: !!w.category
        }))
      });
    } catch (error: any) {
      console.error('Error loading progress/streak/words:', error);
      // Use defaults - empty arrays/0
    }

    return (
      <div className="min-h-screen bg-neutral-50">
        <ModernNavBar
          childName={child.name}
          avatar={child.avatar || ''}
          level={levelState.level}
          streak={streak}
          xp={levelState.xp}
        />
        <div className="max-w-2xl mx-auto bg-white min-h-screen pt-16 pb-20 md:pb-8 shadow-sm">
          <LearnPath childId={child.id} levelState={levelState} progress={progress} allWords={allWords} />
        </div>
      </div>
    );
  } catch (error: any) {
    // Log error and return a safe fallback UI
    console.error('Error rendering LearnPathPage:', error);
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-neutral-600">שגיאה בטעינת הדף</p>
          <p className="text-sm text-neutral-500 mt-2">נסה לרענן את הדף</p>
        </div>
      </div>
    );
  }
}
