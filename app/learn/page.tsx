import { getCurrentChild } from '@/lib/auth-nextauth';
import { getLevelState } from '@/app/actions/levels';
import { getWordsByCategory } from '@/app/actions/words';
import { getTodayDate } from '@/lib/utils';
import LearnLetters from '@/components/LearnLetters';
import LearnQuizWrapper from '@/components/LearnQuizWrapper';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import PageHeader from '@/components/PageHeader';
import ProgressSidePanel from '@/components/ProgressSidePanel';
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
  const mode = params?.mode || 'learn'; // Default to 'learn' if not specified

  // Get child's level to determine what to show
  let levelState;
  try {
    levelState = await getLevelState(child.id);
  } catch (error: any) {
    // Default to level 1 if there's an error
    levelState = { level: 1, xp: 0, id: '', childId: child.id, updatedAt: new Date() };
  }

  // If a specific letter is requested, force level 1
  if (letterId) {
    levelState = { level: 1, xp: levelState.xp, id: levelState.id, childId: child.id, updatedAt: levelState.updatedAt };
  }

  const levelTitle = mode === 'quiz' ? 'חידון' : (levelState.level === 1 ? 'ללמוד' : 'ללמוד');

  // Handle quiz mode - Level 1 (letters) doesn't have quizzes
  if (mode === 'quiz' && levelState.level === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProgressSidePanel childId={child.id} levelState={levelState} />
        <div className="max-w-2xl mx-auto bg-white min-h-screen">
          <PageHeader title="חידון" childName={child.name} avatar={child.avatar} currentChildId={child.id} />
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">עדיין לא זמין</h2>
            <p className="text-lg text-gray-600 mb-6">
              סיים ללמוד את כל האותיות כדי לפתוח חידונים!
            </p>
            <a
              href="/learn"
              className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              חזור ללמידה →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Load words for word learning/quiz (level 2+)
  let todayPlan = null;
  let categoryWords: any[] = [];
  if (levelState.level >= 2) {
    // Require category for level 2+ - redirect to path if not provided
    if (!category) {
      redirect('/learn/path');
    }
    
    // Use requested level if provided, otherwise use child's current level
    let levelToUse = requestedLevel || levelState.level;
    
    // Special case: Starter category words have difficulty 1 (level 2), but are shown at level 1
    // If user is at level 1 and clicks Starter, we need to fetch difficulty 1 words
    if (category === 'Starter' && levelToUse === 1) {
      levelToUse = 2; // Starter words are difficulty 1, which corresponds to level 2
    }
    
    // For quiz mode, fetch all words in category without level filtering
    // For learn mode, filter by level
    categoryWords = mode === 'quiz' 
      ? await getWordsByCategory(category)
      : await getWordsByCategory(category, levelToUse);
    
    // Debug logging
    console.log('[LearnPage] Category:', category, 'Level:', levelToUse, 'Mode:', mode, 'Words found:', categoryWords.length);
    
    if (categoryWords.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          <ProgressSidePanel childId={child.id} levelState={levelState} />
          <div className="max-w-2xl mx-auto bg-white min-h-screen">
            <PageHeader title={levelTitle} childName={child.name} avatar={child.avatar} currentChildId={child.id} />
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">אין מילים בקטגוריה</h2>
              <p className="text-lg text-gray-600 mb-6">
                הקטגוריה שנבחרה לא מכילה מילים זמינות ברמה זו.
              </p>
              <Link
                href="/learn/path"
                className="inline-block bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                חזור לנתיב →
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    // Create a temporary plan structure with words from this category
    todayPlan = {
      id: mode === 'quiz' ? `category-${category}` : `category-${category}-level-${levelToUse}`,
      childId: child.id,
      date: getTodayDate(),
      words: categoryWords.map(word => ({ word })),
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressSidePanel childId={child.id} levelState={levelState} />
      <div className="max-w-2xl mx-auto bg-white min-h-screen">
        <PageHeader title={levelTitle} childName={child.name} avatar={child.avatar} currentChildId={child.id} backHref="/learn/path" />

        {/* Learning/Quiz interface */}
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
