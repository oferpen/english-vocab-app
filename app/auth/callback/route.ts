import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/parent';

  console.log('[Auth Callback] Received request:', { 
    code: code ? 'present' : 'missing', 
    error,
    errorDescription,
    next, 
    origin 
  });

  // Handle errors from Supabase (e.g., expired magic link)
  if (error) {
    console.error('[Auth Callback] Auth error:', { error, errorDescription });
    const errorMessage = errorDescription 
      ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
      : 'Authentication error occurred';
    return redirect(`${origin}/parent?error=${encodeURIComponent(errorMessage)}`);
  }

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[Auth Callback] Error exchanging code:', error);
        return redirect(`${origin}/parent?error=${encodeURIComponent(error.message)}`);
      }

      console.log('[Auth Callback] Session exchanged successfully');
      
      // Check if parent exists, create if not
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[Auth Callback] Error getting user:', userError);
        return redirect(`${origin}/parent?error=${encodeURIComponent(userError.message)}`);
      }

      if (user) {
        console.log('[Auth Callback] User found:', { id: user.id, email: user.email });
        
        // Create or update child profile directly linked to Google user
        const { data: child, error: childError } = await supabase
          .from('child_profiles')
          .select('id')
          .eq('provider_user_id', user.id)
          .single();

        if (childError && childError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('[Auth Callback] Error checking child:', childError);
        }

        if (!child) {
          console.log('[Auth Callback] Creating new child profile');
          // Extract name from Google profile
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'ילד';
          
          const { error: insertError } = await supabase.from('child_profiles').insert({
            provider_user_id: user.id,
            nickname: name,
            avatar_id: '👶',
            age_band: null, // Can be set later
          });

          if (insertError) {
            console.error('[Auth Callback] Error creating child:', insertError);
            return redirect(`${origin}?error=${encodeURIComponent(insertError.message)}`);
          }
          console.log('[Auth Callback] Child profile created');
        } else {
          console.log('[Auth Callback] Child profile exists:', child.id);
        }
      }
      
      console.log('[Auth Callback] Redirecting to home');
      return redirect(`${origin}/`);
    } catch (error: any) {
      console.error('[Auth Callback] Unexpected error:', error);
      return redirect(`${origin}/parent?error=${encodeURIComponent(error.message || 'Unknown error')}`);
    }
  }

  console.log('[Auth Callback] No code provided, redirecting to parent');
  return redirect(`${origin}/parent`);
}
