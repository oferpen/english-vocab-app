import { getCurrentChild } from '@/lib/auth-nextauth';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getLevelState, getXPForNextLevel, getXPForLevel } from '@/app/actions/levels';
import { getAllMissions } from '@/app/actions/missions';
import { getTodayPlan } from '@/app/actions/plans';
import ProgressDisplay from '@/components/ProgressDisplay';
import BottomNav from '@/components/BottomNav';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const child = await getCurrentChild();
  
  if (!child) {
    return <GoogleSignIn />;
  }

  const progress = await getAllProgress(child.id);
  const streak = await getStreak(child.id);
  const levelState = await getLevelState(child.id);
  const missions = await getAllMissions(child.id);
  const todayPlan = await getTodayPlan(child.id);

  const masteredWords = progress.filter((p) => p.masteryScore >= 80).length;
  const totalLearned = progress.filter((p) => p.timesSeenInLearn > 0).length;
  const needsReview = progress.filter((p) => p.needsReview).length;

  const todayWords = todayPlan?.words?.map((w: any) => w.word) || [];
  const todayLearned = progress.filter((p) => {
    const wordId = p.wordId;
    return todayWords.some((w: any) => w.id === wordId) && p.lastSeenAt && 
           new Date(p.lastSeenAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  }).length;

  const xpForNext = await getXPForNextLevel(levelState.level);
  const xpForCurrent = await getXPForLevel(levelState.level);
  const xpProgress = levelState.level < 10 
    ? ((levelState.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="התקדמות" childName={child.name} avatar={child.avatar} currentChildId={child.id} />
      <ProgressDisplay
        child={child}
        progress={progress}
        streak={streak}
        levelState={levelState}
        missions={missions}
        masteredWords={masteredWords}
        totalLearned={totalLearned}
        needsReview={needsReview}
        todayLearned={todayLearned}
        todayTotal={todayWords.length}
        xpProgress={xpProgress}
        xpForNext={xpForNext}
      />
      <BottomNav />
    </div>
  );
}
