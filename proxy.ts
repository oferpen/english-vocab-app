import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware to ensure deviceId cookie exists
 * Simple approach - just set cookie if missing
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Get deviceId from cookies
  let deviceId = request.cookies.get('deviceId')?.value;

  // If no deviceId, generate one and set it
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    
    // Set cookie for 1 year
    response.cookies.set('deviceId', deviceId, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
