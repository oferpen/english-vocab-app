import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/AuthService';

/**
 * Login API endpoint
 * Creates or finds user and returns success
 */
export async function POST(request: NextRequest) {
  try {
    const { user, deviceId } = await AuthService.getOrCreateAnonymousUser();
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      deviceId,
    });
  } catch (error: any) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Login failed',
      },
      { status: 500 }
    );
  }
}
