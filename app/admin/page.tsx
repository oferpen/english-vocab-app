import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth-helper';
import AdminWordsManager from '@/components/admin/AdminWordsManager';

const SUPER_ADMIN_EMAIL = 'oferpen@gmail.com';

export default async function AdminPage() {
  const session = await getAuthSession();
  
  // Check if user is authenticated
  if (!session?.user?.email) {
    // Not logged in - redirect to home
    redirect('/');
  }
  
  // Check if user is the super admin
  if (session.user.email !== SUPER_ADMIN_EMAIL) {
    // Wrong email - redirect to home
    redirect('/');
  }
  
  // User is authenticated and is the super admin
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminWordsManager />
    </div>
  );
}
