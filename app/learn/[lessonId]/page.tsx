import { getCurrentChild } from '@/lib/auth-nextauth';
import { getLetter } from '@/app/actions/letters';
import { getWord } from '@/app/actions/words';
import LearnLetters from '@/components/LearnLetters';
import LearnToday from '@/components/LearnToday';
import BottomNav from '@/components/BottomNav';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import PageHeader from '@/components/PageHeader';
import { getTodayDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface LessonPageProps {
  params: {
    lessonId: string;
  };
  searchParams: {
    letter?: string;
    word?: string;
  };
}

export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  const child = await getCurrentChild();
  
  if (!child) {
    return <GoogleSignIn />;
  }

  // Handle letter lesson
  if (searchParams.letter) {
    const letter = await getLetter(searchParams.letter);
    if (!letter) {
      return <div>אות לא נמצאה</div>;
    }
    
    return (
      <div className="min-h-screen bg-gray-50">
        <BottomNav />
        <div className="pt-20 md:pt-20">
          <div className="max-w-2xl mx-auto bg-white min-h-screen">
            <PageHeader title="ללמוד" childName={child.name} avatar={child.avatar} currentChildId={child.id} />
            <LearnLetters childId={child.id} />
          </div>
        </div>
      </div>
    );
  }

  // Handle word lesson
  if (searchParams.word) {
    const word = await getWord(searchParams.word);
    if (!word) {
      return <div>מילה לא נמצאה</div>;
    }

    // Create a simple plan with just this word (for individual word learning)
    const todayPlan = {
      id: `word-${word.id}`,
      childId: child.id,
      date: getTodayDate(),
      words: [{ word }],
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <BottomNav />
        <div className="pt-20 md:pt-20">
          <div className="max-w-2xl mx-auto bg-white min-h-screen">
            <PageHeader title="ללמוד" childName={child.name} avatar={child.avatar} currentChildId={child.id} />
            <LearnToday childId={child.id} todayPlan={todayPlan} wordId={word.id} category={word.category} />
          </div>
        </div>
      </div>
    );
  }

  // Default: redirect to learn path
  return null;
}
