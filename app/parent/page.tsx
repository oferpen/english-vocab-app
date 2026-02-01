// Parent/Settings panel page
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import SettingsPanel from '@/components/SettingsPanel';
import ProgressDashboard from '@/components/ProgressDashboard';
import ModernNavBar from '@/components/ModernNavBar';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ParentPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>User not found</div>;
  }

  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavBar
        name={user.name || 'User'}
        avatar={user.avatar || undefined}
        level={user.level}
        streak={0}
        xp={user.xp}
      />
      <div className="max-w-4xl mx-auto py-8 px-4 pt-24">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">הגדרות והתקדמות</h1>

        <div className="grid gap-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">הגדרות</h2>
            <SettingsPanel />
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">התקדמות</h2>
            <ProgressDashboard userId={user.id} />
          </section>
        </div>
      </div>
    </div>
  );
}
