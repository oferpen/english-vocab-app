// Parent panel page
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import ParentPanel from '@/components/ParentPanel';

export const dynamic = 'force-dynamic';

export default async function ParentPage() {
  const session = await getServerSession(authOptions);

  // Always show ParentPanel - it will handle PIN/Google auth internally
  return <ParentPanel session={session} />;
}
