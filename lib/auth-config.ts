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
  providers.push(
    GoogleProvider({
      clientId: 'dummy',
      clientSecret: 'dummy',
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    sessionToken: {
      name: `english-path.session-token`,
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
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // 2. Find if the current device is associated with ANY anonymous account
          let anonymousUser = null;
          if (deviceId) {
            anonymousUser = await prisma.user.findUnique({
              where: { deviceId },
            });
            // Verify it's actually anonymous
            if (anonymousUser && !anonymousUser.isAnonymous) {
              anonymousUser = null;
            }
          }

          if (!existingUser) {
            // CASE 1: Google account does NOT exist -> Create or Upgrade
            if (anonymousUser) {
              console.log(`[NextAuth] Upgrading anonymous user ${anonymousUser.id} to Google account (${user.email})`);
              await prisma.user.update({
                where: { id: anonymousUser.id },
                data: {
                  email: user.email,
                  googleId: account.providerAccountId,
                  name: user.name || undefined,
                  image: user.image || undefined,
                  isAnonymous: false,
                },
              });
            } else {
              console.log(`[NextAuth] Creating new Google user for ${user.email}`);
              // If device is already claimed by a DIFFERENT Google account, ignore deviceId to avoid unique constraint
              // (Though logic above ensures anonymousUser is null if it's not anonymous)
              // But what if deviceId maps to an existing Google User that ISN'T this one? 
              // We just checked `findUnique({ where: { deviceId } })`. 
              // unique constraint on deviceId means we can't use it if it's taken.
              let deviceIdToUse = deviceId;
              if (deviceId) {
                const owner = await prisma.user.findUnique({ where: { deviceId } });
                if (owner) deviceIdToUse = undefined; // Device taken, so don't claim it for this new user yet? Or force claim?
                // Better: If device is taken by someone else, generate new one? Or just don't set it on the user.
                // The user can have a null deviceId if they are purely Google auth based on a shared device.
              }

              await prisma.user.create({
                data: {
                  email: user.email,
                  googleId: account.providerAccountId,
                  name: user.name || undefined,
                  image: user.image || undefined,
                  deviceId: deviceIdToUse,
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
            // CASE 2: Google account already exists -> Update info & Link Device
            console.log(`[NextAuth] Found existing Google user ${existingUser.id} for ${user.email}`);

            // Link Google ID if missing (legacy or manual creation?)
            let updateData: any = {};
            if (!existingUser.googleId) {
              updateData.googleId = account.providerAccountId;
            }
            if (user.name && user.name !== existingUser.name) updateData.name = user.name;
            if (user.image && user.image !== existingUser.image) updateData.image = user.image;

            // Link Device ID if this device is not claimed, or if we want to "switch" this device to this user?
            // If I login on a shared computer, I expect my account.
            // If the device ID was associated with an anonymous user, we might want to abandon that anonymous user?
            // Or if the device ID is associated with ME already, great.
            // If the device ID is free (no user), claim it.
            if (deviceId) {
              const deviceOwner = await prisma.user.findUnique({ where: { deviceId } });
              if (!deviceOwner) {
                // Device is free, claim it
                updateData.deviceId = deviceId;
              } else if (deviceOwner.id === existingUser.id) {
                // Already mine, do nothing
              } else if (deviceOwner.isAnonymous) {
                // Device owned by anon user. I am logging in as Google User. 
                // The anon user is now "abandoned" on this device effectively. 
                // We should probably UNLINK the anon user from this device so the Google user can claim it?
                // Or just leave it. If we leave it, `getCurrentUser` by deviceId will find the anon user, 
                // BUT `getCurrentUser` checks session FIRST. So session wins. 
                // So we don't strictly *need* to put deviceId on the Google User record, 
                // UNLESS we want "Remember Me" style behavior where I stay logged in even if session expires?
                // Current arch relies on Session for Google, DeviceId for Anon. 
                // So actually, we DON'T need to set deviceId on the Google User.
              }
            }

            if (Object.keys(updateData).length > 0) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: updateData,
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
    async jwt({ token, user }) {
      // Only process on sign in (when user is present)
      if (user?.email) {
        token.email = user.email;
        // We don't need parentAccountId anymore in token
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.email) {
        (session.user as any).email = token.email;
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
