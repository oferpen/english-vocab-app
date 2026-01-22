import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function getAuthSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    // Error getting auth session
    return null;
  }
}
