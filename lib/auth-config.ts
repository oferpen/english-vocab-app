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
      // After successful login, redirect to home page
      // The home page will check session and redirect to /learn/path if child exists
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/`;
      }
      return baseUrl;
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google' && user.email) {
          // Find or create parent account
          let parentAccount = await prisma.parentAccount.findUnique({
            where: { email: user.email },
            include: { children: true },
          });

          if (!parentAccount) {
            // Create new parent account only (don't create child automatically)
            await prisma.parentAccount.create({
              data: {
                email: user.email,
                googleId: account.providerAccountId,
                name: user.name || undefined,
                image: user.image || undefined,
                settingsJson: JSON.stringify({
                  questionTypes: {
                    enToHe: true,
                    heToEn: true,
                    audioToEn: true,
                  },
                }),
              },
            });
          } else {
            // Link Google account to existing parent account if needed
            if (!parentAccount.googleId) {
              await prisma.parentAccount.update({
                where: { id: parentAccount.id },
                data: {
                  googleId: account.providerAccountId,
                  name: user.name || parentAccount.name,
                  image: user.image || parentAccount.image,
                },
              });
            }
            // Don't auto-create children - let user create them manually
          }
        }
        return true;
      } catch (error) {
        // Still allow sign in even if database operation fails
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
