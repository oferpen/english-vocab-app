// New home page using Supabase Auth + ProfilePicker
// This will replace app/page.tsx after testing

import { createSupabaseServerClient } from '@/lib/supabase-server';
import ProfilePicker from '@/components/auth/ProfilePicker';
import WelcomeScreen from '@/components/WelcomeScreen';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no parent logged in, show profile picker (which will redirect to /parent)
  if (!user) {
    return (
      <div className="min-h-screen">
        <ProfilePicker />
      </div>
    );
  }

  // Get active child
  const { data: parent } = await supabase
    .from('parents')
    .select('last_active_child_id')
    .eq('provider_user_id', user.id)
    .single();

  if (!parent?.last_active_child_id) {
    return (
      <div className="min-h-screen">
        <ProfilePicker />
      </div>
    );
  }

  const { data: child } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('id', parent.last_active_child_id)
    .single();

  if (!child) {
    return (
      <div className="min-h-screen">
        <ProfilePicker />
      </div>
    );
  }

  // Get level and streak (simplified for now)
  const { data: levelState } = await supabase
    .from('level_states')
    .select('level')
    .eq('child_id', child.id)
    .single();

  // Show welcome screen with child info
  return (
    <div className="min-h-screen bg-gray-50">
      <WelcomeScreen
        childName={child.nickname}
        avatar={child.avatar_id}
        level={levelState?.level || 1}
        streak={0} // TODO: Calculate from events
        isParentLoggedIn={true}
        showProgress={true}
      />
    </div>
  );
}
