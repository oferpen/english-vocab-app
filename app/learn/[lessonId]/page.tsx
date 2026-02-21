import { getCurrentUser } from '@/lib/auth';
import { getLetter, getWord } from '@/app/actions/content';
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
  const user = await getCurrentUser();

  if (!user || !(user as any).id) {
    return <GoogleSignIn />;
  }

  const userWithId = user as any;

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
            <PageHeader title="ללמוד" name={userWithId.name || 'User'} avatar={userWithId.avatar || userWithId.image} />
            <LearnToday userId={userWithId.id} level={1} />
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
      userId: userWithId.id,
      date: getTodayDate(),
      words: [{ word }],
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <BottomNav />
        <div className="pt-20 md:pt-20">
          <div className="max-w-2xl mx-auto bg-white min-h-screen">
            <PageHeader title="ללמוד" name={userWithId.name || 'User'} avatar={userWithId.avatar || userWithId.image} />
            <LearnToday userId={userWithId.id} todayPlan={todayPlan} wordId={word.id} category={word.category ?? undefined} />
          </div>
        </div>
      </div>
    );
  }

  // Default: redirect to learn path
  return null;
}
