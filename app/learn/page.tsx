import { getActiveChild } from '@/app/actions/children';
import { getTodayPlan } from '@/app/actions/plans';
import LearnTabs from '@/components/LearnTabs';
import BottomNav from '@/components/BottomNav';
import ChildSwitchLock from '@/components/ChildSwitchLock';
import { cookies } from 'next/headers';

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

  let todayPlan = await getTodayPlan(child.id);
  
  // Auto-generate plan if none exists for today
  if (!todayPlan) {
    try {
      const { generateStarterPack } = await import('@/app/actions/plans');
      const { getTodayDate } = await import('@/lib/utils');
      todayPlan = await generateStarterPack(child.id, getTodayDate(), 10);
    } catch (error: any) {
      // If database tables don't exist yet, try to create them
      if (error.message?.includes('does not exist') || error.code === 'P2021') {
        // Database not ready, will be set up on first request
        console.error('Database not ready:', error.message);
      } else {
        console.error('Failed to auto-generate plan:', error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">ללמוד</h1>
          {child && (
            <p className="text-sm text-gray-600 mt-1">
              שלום {child.name}! {child.avatar || '👶'}
            </p>
          )}
        </div>
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
