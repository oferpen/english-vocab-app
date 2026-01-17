// New authentication helpers using Supabase
import { createSupabaseServerClient } from './supabase-server';
import { supabase } from './supabase';

export async function getCurrentParent() {
  const supabaseClient = await createSupabaseServerClient();
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  if (!user) return null;

  const { data: parent } = await supabaseClient
    .from('parents')
    .select('*')
    .eq('provider_user_id', user.id)
    .single();

  return parent;
}

export async function getActiveChild() {
  const parent = await getCurrentParent();
  if (!parent?.last_active_child_id) return null;

  const supabaseClient = await createSupabaseServerClient();
  const { data: child } = await supabaseClient
    .from('child_profiles')
    .select('*')
    .eq('id', parent.last_active_child_id)
    .single();

  return child;
}

export async function getAllChildren() {
  const parent = await getCurrentParent();
  if (!parent) return [];

  const supabaseClient = await createSupabaseServerClient();
  const { data: children } = await supabaseClient
    .from('child_profiles')
    .select('*')
    .eq('parent_id', parent.id)
    .order('created_at', { ascending: false });

  return children || [];
}
