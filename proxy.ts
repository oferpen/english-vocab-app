import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Get deviceId from cookies
  let deviceId = request.cookies.get('deviceId')?.value;

  // Check if deviceId is in URL query params (fallback for cookie timing issues)
  const url = new URL(request.url);
  const deviceIdFromUrl = url.searchParams.get('deviceId');
  
  // Use deviceId from URL if cookie doesn't exist (cookie timing issue workaround)
  if (!deviceId && deviceIdFromUrl) {
    deviceId = deviceIdFromUrl;
    // Set cookie from URL param
    response.cookies.set('deviceId', deviceId, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    // Don't redirect - let the request continue with the cookie set
    // The cookie will be available to the page component
  }

  // If no deviceId, generate one and set it
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    // Set cookie for 1 year
    response.cookies.set('deviceId', deviceId, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
