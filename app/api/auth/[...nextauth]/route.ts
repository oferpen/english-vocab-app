import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-config';

let handler;
try {
  handler = NextAuth(authOptions);
} catch (error: any) {
  // Fallback handler if NextAuth fails
  handler = async () => {
    return new Response(
      JSON.stringify({ error: 'Authentication not configured', details: error?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  };
}

export { handler as GET, handler as POST };
