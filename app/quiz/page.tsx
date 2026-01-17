import { getCurrentChild } from '@/lib/auth-nextauth';
import { getTodayPlan } from '@/app/actions/plans';
import QuizTabs from '@/components/QuizTabs';
import BottomNav from '@/components/BottomNav';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  const child = await getCurrentChild();
  
  if (!child) {
    return <GoogleSignIn />;
  }

  let todayPlan = await getTodayPlan(child.id);
  
  // Auto-generate plan if none exists for today
  if (!todayPlan) {
    const { generateStarterPack } = await import('@/app/actions/plans');
    const { getTodayDate } = await import('@/lib/utils');
    try {
      todayPlan = await generateStarterPack(child.id, getTodayDate(), 10);
    } catch (error) {
      console.error('Failed to auto-generate plan:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="חידון" childName={child.name} avatar={child.avatar} currentChildId={child.id} />
      <QuizTabs childId={child.id} todayPlan={todayPlan} />
      <BottomNav />
    </div>
  );
}
