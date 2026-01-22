import { getCurrentChild } from '@/lib/auth-nextauth';
import { getLevelState } from '@/app/actions/levels';
import LearnPath from '@/components/LearnPath';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import PageHeader from '@/components/PageHeader';
import ProgressSidePanel from '@/components/ProgressSidePanel';

export const dynamic = 'force-dynamic';

export default async function LearnPathPage() {
  try {
    const child = await getCurrentChild();
    
    if (!child) {
      return <GoogleSignIn />;
    }

    // Get child's level to determine what to show
    let levelState;
    try {
      levelState = await getLevelState(child.id);
    } catch (error: any) {
      // Default to level 1 if there's an error
      levelState = { level: 1, xp: 0, id: '', childId: child.id, updatedAt: new Date() };
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white min-h-screen">
          <PageHeader title="" childName={child.name} avatar={child.avatar} currentChildId={child.id} showParentPanel={true} />
          <LearnPath childId={child.id} />
        </div>
        <ProgressSidePanel childId={child.id} levelState={levelState} />
      </div>
    );
  } catch (error: any) {
    // Log error and return a safe fallback UI
    console.error('Error rendering LearnPathPage:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">שגיאה בטעינת הדף</p>
          <p className="text-sm text-gray-500 mt-2">נסה לרענן את הדף</p>
        </div>
      </div>
    );
  }
}
