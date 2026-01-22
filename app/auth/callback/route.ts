import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/parent';

  // Auth callback received

  // Handle errors from Supabase (e.g., expired magic link)
  if (error) {
    // Auth error
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
        // Error exchanging code
        return redirect(`${origin}/parent?error=${encodeURIComponent(error.message)}`);
      }

      // Session exchanged successfully
      
      // Check if parent exists, create if not
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        // Error getting user
        return redirect(`${origin}/parent?error=${encodeURIComponent(userError.message)}`);
      }

      if (user) {
        // User found
        
        // Create or update child profile directly linked to Google user
        const { data: child, error: childError } = await supabase
          .from('child_profiles')
          .select('id')
          .eq('provider_user_id', user.id)
          .single();

        if (childError && childError.code !== 'PGRST116') { // PGRST116 = no rows returned
          // Error checking child
        }

        if (!child) {
          // Creating new child profile
          // Extract name from Google profile
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'ילד';
          
          const { error: insertError } = await supabase.from('child_profiles').insert({
            provider_user_id: user.id,
            nickname: name,
            avatar_id: '👶',
            age_band: null, // Can be set later
          });

          if (insertError) {
            // Error creating child
            return redirect(`${origin}?error=${encodeURIComponent(insertError.message)}`);
          }
          // Child profile created
        } else {
          // Child profile exists
        }
      }
      
      // Redirecting to home
      return redirect(`${origin}/`);
    } catch (error: any) {
      // Unexpected error
      return redirect(`${origin}/parent?error=${encodeURIComponent(error.message || 'Unknown error')}`);
    }
  }

  // No code provided, redirecting to parent
  return redirect(`${origin}/parent`);
}
