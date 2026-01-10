import { hasPIN } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import ParentPanel from '@/components/ParentPanel';

export const dynamic = 'force-dynamic';

export default async function ParentPage() {
  const pinExists = await hasPIN();
  
  if (!pinExists) {
    redirect('/parent/setup');
  }

  return <ParentPanel />;
}
