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
  console.warn('Warning: No OAuth providers configured. Google login will not be available.');
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
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
                  quizLength: 10,
                  extraLearningStrategy: 'unseen',
                  streakRule: 'either',
                  rewardIntensity: 'normal',
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
        console.error('Error in signIn callback:', error);
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
          console.error('Error finding parent account in jwt callback:', error);
          // Don't throw - just log the error
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
    signIn: '/parent',
  },
  session: {
    strategy: 'jwt',
  },
};
