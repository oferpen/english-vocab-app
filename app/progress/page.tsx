import { getActiveChild } from '@/app/actions/children';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getLevelState, getXPForNextLevel, getXPForLevel } from '@/app/actions/levels';
import { getAllMissions } from '@/app/actions/missions';
import { getTodayPlan } from '@/app/actions/plans';
import ProgressDisplay from '@/components/ProgressDisplay';
import BottomNav from '@/components/BottomNav';
import ChildSwitchLock from '@/components/ChildSwitchLock';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const child = await getActiveChild();
  
  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl mb-4">אין ילד פעיל במערכת</p>
          <a href="/parent" className="text-blue-600 underline">
            עבור לפאנל הורים
          </a>
        </div>
      </div>
    );
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
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">התקדמות</h1>
        <div className="flex gap-2">
          <ChildSwitchLock />
          <a href="/parent" className="text-sm text-gray-600">הורים</a>
        </div>
      </header>
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
