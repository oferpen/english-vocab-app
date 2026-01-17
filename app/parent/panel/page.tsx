// Parent panel - protected route
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import ParentPanelNew from '@/components/auth/ParentPanelNew';

export const dynamic = 'force-dynamic';

export default async function ParentPanelPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/parent');
  }

  return <ParentPanelNew user={user} />;
}
