import { getActiveChild } from '@/app/actions/children';
import { getTodayPlan } from '@/app/actions/plans';
import LearnTabs from '@/components/LearnTabs';
import BottomNav from '@/components/BottomNav';
import ChildSwitchLock from '@/components/ChildSwitchLock';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
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

  const todayPlan = await getTodayPlan(child.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ללמוד</h1>
        <div className="flex gap-2">
          <ChildSwitchLock />
          <a href="/parent" className="text-sm text-gray-600">הורים</a>
        </div>
      </header>
      <LearnTabs childId={child.id} todayPlan={todayPlan} />
      <BottomNav />
    </div>
  );
}
