import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ParentPanel from '@/components/ParentPanel';

export default async function ParentPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/');
  }

  return <ParentPanel userId={user.id} />;
}
