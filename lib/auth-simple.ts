// Simplified auth helpers - Google login directly to child
import { createSupabaseServerClient } from './supabase-server';

export async function getCurrentChild() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: child } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('provider_user_id', user.id)
    .single();

  return child;
}
