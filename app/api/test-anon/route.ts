import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    let deviceId = cookieStore.get('deviceId')?.value;

    if (!deviceId) {
      deviceId = randomUUID();
      cookieStore.set('deviceId', deviceId, {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
    }

    // Test database query with timeout
    const dbQuery = prisma.user.findUnique({
      where: { deviceId },
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 5000);
    });

    const startTime = Date.now();
    let user: any = null;
    let dbError = null;

    try {
      user = await Promise.race([dbQuery, timeoutPromise]) as any;
    } catch (error: any) {
      dbError = error.message;
      user = null;
    }

    const queryTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      deviceId,
      userFound: !!user,
      isAnonymous: user?.isAnonymous || false,
      queryTime: `${queryTime}ms`,
      dbError,
      databaseConnected: !dbError || dbError.includes('timeout'),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
