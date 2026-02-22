/**
 * Authentication Service
 * Handles all authentication logic
 */
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

export class AuthService {
  /**
   * Get or create device ID from cookie
   */
  static async getDeviceId(): Promise<string> {
    const cookieStore = await cookies();
    let deviceId = cookieStore.get('deviceId')?.value;

    if (!deviceId) {
      deviceId = randomUUID();
      await this.setDeviceIdCookie(deviceId);
    }

    return deviceId;
  }

  /**
   * Set device ID cookie
   */
  static async setDeviceIdCookie(deviceId: string): Promise<void> {
    const cookieStore = await cookies();
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    
    cookieStore.set('deviceId', deviceId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    });
  }

  /**
   * Find user by device ID
   */
  static async findUserByDeviceId(deviceId: string) {
    try {
      return await prisma.user.findUnique({
        where: { deviceId },
      });
    } catch (error) {
      console.error('[AuthService] Error finding user:', error);
      return null;
    }
  }

  /**
   * Create anonymous user
   */
  static async createAnonymousUser(deviceId: string) {
    try {
      return await prisma.user.create({
        data: {
          deviceId,
          isAnonymous: true,
          name: 'Guest',
        },
      });
    } catch (error) {
      console.error('[AuthService] Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get or create anonymous user
   */
  static async getOrCreateAnonymousUser(): Promise<{ user: any; deviceId: string }> {
    const deviceId = await this.getDeviceId();
    let user = await this.findUserByDeviceId(deviceId);

    if (!user) {
      user = await this.createAnonymousUser(deviceId);
    }

    return { user, deviceId };
  }
}
