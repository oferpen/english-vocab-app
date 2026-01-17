import { getCurrentChild } from '@/lib/auth-nextauth';
import { getTodayPlan } from '@/app/actions/plans';
import LearnTabs from '@/components/LearnTabs';
import BottomNav from '@/components/BottomNav';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function LearnPage() {
  const child = await getCurrentChild();
  
  if (!child) {
    return <GoogleSignIn />;
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
      <PageHeader title="ללמוד" childName={child.name} avatar={child.avatar} currentChildId={child.id} />
      <LearnTabs childId={child.id} todayPlan={todayPlan} />
      <BottomNav />
    </div>
  );
}
