// New parent page using Supabase Auth
// This will replace the current parent/page.tsx after testing

import SignInForm from '@/components/auth/SignInForm';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ParentPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in, redirect to parent panel
  if (user) {
    redirect('/parent/panel');
  }

  return <SignInForm />;
}
