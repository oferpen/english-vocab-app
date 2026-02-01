import { getCurrentUser } from '@/lib/auth';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getLevelState, getXPForNextLevel, getXPForLevel } from '@/app/actions/levels';
import { getAllMissions } from '@/app/actions/missions';
import ProgressDisplay from '@/components/ProgressDisplay';
import BottomNav from '@/components/BottomNav';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <GoogleSignIn />;
  }

  const progress = await getAllProgress(user.id);
  const streak = await getStreak(user.id);
  const levelState = await getLevelState(user.id);
  const missions = await getAllMissions(user.id);

  const masteredWords = progress.filter((p) => p.masteryScore >= 80).length;
  const totalLearned = progress.filter((p) => p.timesSeenInLearn > 0).length;
  const needsReview = progress.filter((p) => p.needsReview).length;

  // Track words learned today by lastSeenAt date (daily plans removed)
  const todayLearned = progress.filter((p) => {
    return p.lastSeenAt &&
      new Date(p.lastSeenAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  }).length;

  const xpForNext = await getXPForNextLevel(levelState.level);
  const xpForCurrent = await getXPForLevel(levelState.level);
  const xpProgress = levelState.level < 10
    ? ((levelState.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <BottomNav />
      <div className="pt-16 md:pt-20">
        <div className="max-w-2xl mx-auto bg-white min-h-screen">
          <PageHeader title="התקדמות" name={user.name || 'Student'} avatar={user.avatar || user.image} userId={user.id} />
          <ProgressDisplay
            child={user}
            progress={progress}
            streak={streak}
            levelState={levelState}
            missions={missions}
            masteredWords={masteredWords}
            totalLearned={totalLearned}
            needsReview={needsReview}
            todayLearned={todayLearned}
            todayTotal={0}
            xpProgress={xpProgress}
            xpForNext={xpForNext}
          />
        </div>
      </div>
    </div>
  );
}
