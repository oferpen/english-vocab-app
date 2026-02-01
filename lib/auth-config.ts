import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

const providers: any[] = [];

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile", // Minimal scopes - only what we need
        },
      },
    })
  );
}

// Ensure we have at least one provider or NextAuth will fail
if (providers.length === 0) {
  // Add a dummy provider to prevent NextAuth from crashing
  // This will show an error when trying to sign in, but won't crash the app
  providers.push(
    GoogleProvider({
      clientId: 'dummy',
      clientSecret: 'dummy',
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google' && user.email) {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          const deviceId = cookieStore.get('deviceId')?.value;

          // 1. Find if a Google account already exists for this email
          let parentAccount = await (prisma as any).parentAccount.findUnique({
            where: { email: user.email },
            include: { children: true },
          });

          // 2. Find if the current device is associated with ANY account
          let accountOnDevice = null;
          if (deviceId) {
            accountOnDevice = await (prisma as any).parentAccount.findUnique({
              where: { deviceId },
              include: { children: true },
            });
            if (accountOnDevice) {
              console.log(`[NextAuth] Device ${deviceId} is associated with account ${accountOnDevice.id} (isAnonymous: ${accountOnDevice.isAnonymous})`);
            }
          }

          if (!parentAccount) {
            // CASE 1: Google account does NOT exist for this email -> Create or Upgrade
            if (accountOnDevice && (accountOnDevice as any).isAnonymous) {
              console.log(`[NextAuth] Upgrading anonymous account ${accountOnDevice.id} to Google account (${user.email})`);
              await (prisma as any).parentAccount.update({
                where: { id: accountOnDevice.id },
                data: {
                  email: user.email,
                  googleId: account.providerAccountId,
                  name: user.name || undefined,
                  image: user.image || undefined,
                  isAnonymous: false,
                },
              });
            } else {
              console.log(`[NextAuth] Creating new Google account for ${user.email}`);
              // If device is already claimed by a DIFFERENT Google account, don't associate it here
              // to avoid P2002. The rotation logic in proxy/startAnonymousSession will handle it.
              const deviceIdToSet = (accountOnDevice && !(accountOnDevice as any).isAnonymous) ? undefined : deviceId;

              await (prisma as any).parentAccount.create({
                data: {
                  email: user.email,
                  googleId: account.providerAccountId,
                  name: user.name || undefined,
                  image: user.image || undefined,
                  deviceId: deviceIdToSet || undefined,
                  isAnonymous: false,
                  settingsJson: JSON.stringify({
                    questionTypes: {
                      enToHe: true,
                      heToEn: true,
                      audioToEn: true,
                    },
                  }),
                },
              });
            }
          } else {
            // CASE 2: Google account already exists -> Merge or Update
            console.log(`[NextAuth] Found existing Google account ${parentAccount.id} for ${user.email}`);

            if (accountOnDevice && (accountOnDevice as any).isAnonymous && accountOnDevice.id !== parentAccount.id) {
              console.log(`[NextAuth] Merging anonymous children from ${accountOnDevice.id} into ${parentAccount.id}`);
              // Move children
              await prisma.childProfile.updateMany({
                where: { parentAccountId: accountOnDevice.id },
                data: { parentAccountId: parentAccount.id }
              });

              // Delete the now-empty anonymous account
              await (prisma as any).parentAccount.delete({
                where: { id: accountOnDevice.id }
              });

              // Safely associate deviceId if not already set
              if (!parentAccount.deviceId && deviceId) {
                await (prisma as any).parentAccount.update({
                  where: { id: parentAccount.id },
                  data: { deviceId }
                });
              }
            }

            // Link Google ID if missing
            if (!parentAccount.googleId) {
              await (prisma as any).parentAccount.update({
                where: { id: parentAccount.id },
                data: {
                  googleId: account.providerAccountId,
                  name: user.name || (parentAccount as any).name,
                  image: user.image || (parentAccount as any).image,
                },
              });
            }
          }
        }
        return true;
      } catch (error) {
        console.error('Error in NextAuth signIn callback:', error);
        return true;
      }
    },
    async jwt({ token, user, account }) {
      // Only process on sign in (when user is present)
      if (user?.email) {
        token.email = user.email;
        try {
          // Find parent account by email
          const parentAccount = await prisma.parentAccount.findUnique({
            where: { email: user.email },
          });
          if (parentAccount) {
            token.parentAccountId = parentAccount.id;
          }
        } catch (error) {
          // Don't throw - continue without parent account ID
        }
      }
      // Always return token, even if no user (for existing sessions)
      return token;
    },
    async session({ session, token }) {
      // Add custom properties if token exists
      if (session?.user && token) {
        (session.user as any).parentAccountId = token.parentAccountId;
        if (token.email) {
          (session.user as any).email = token.email;
        }
      }

      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
};
