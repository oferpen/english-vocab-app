import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function getAuthSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
    }
    return null;
  }
}
