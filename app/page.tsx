import { getActiveChild } from '@/app/actions/children';
import { getLevelState } from '@/app/actions/levels';
import { getStreak } from '@/app/actions/streak';
import WelcomeScreen from '@/components/WelcomeScreen';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const child = await getActiveChild();
  
  if (!child) {
    redirect('/parent');
  }

  const levelState = await getLevelState(child.id);
  const streak = await getStreak(child.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <WelcomeScreen 
        childName={child.name}
        avatar={child.avatar || undefined}
        level={levelState.level}
        streak={streak}
      />
    </div>
  );
}
