# Agent Intelligence: EnglishPath (אנגליש-פאת')

This document provides essential context and instructions for AI agents working on this codebase.

## 🚀 Technical Stack
- **Framework**: Next.js 16.1.6 (Turbopack)
- **Language**: TypeScript
- **React**: Version 19.2.4
- **Database**: Prisma (PostgreSQL in production, SQLite locally)
- **Auth**: NextAuth.js (Google Provider) + Anonymous Session Management
- **Styling**: Tailwind CSS (Vibrant Kids-First Theme)
- **State Management**: Zustand (for client-side UI state)

## 🔐 Authentication & Identity (Single User Model)
This app uses a simplified identity system:
- **One User, One Profile**: The complex Parent/Child hierarchy has been replaced by a single `User` model.
- **Anonymous Entry**: Users can start without login. A `deviceId` is generated and stored in a cookie. The `User` record has `isAnonymous: true`.
- **Identity Provider**: Identity is managed by `proxy.ts`. Every request must have a `deviceId`.
- **Seamless Upgrade**: When an anonymous user signs in with Google, their anonymous `User` record is updated with Google credentials (email, image) and `isAnonymous` is set to `false`.
- **Privacy**: Data fetching (Progress, QuizAttempts, etc.) is scoped to the current `User` ID.

## 📁 Key File Conventions
- **proxy.ts**: Replaced `middleware.ts` for Next.js 16 compliance. Handles `deviceId` generation.
- **lib/auth.ts**: Core authentication logic and helpers.
- **app/actions/auth.ts**: Server actions for sessions and user management.
- **lib/auth-config.ts**: NextAuth configuration, including the critical `signIn` callback for account merging.
- **prisma/schema.prisma**: Source of truth for the database.
- **app/actions/user.ts**: (New) Actions for updating user profile data.

## 🎯 Architectural Principles
1.  **Server-First Fetching**: Prioritize server-side data fetching in `page.tsx`.
2.  **User Scoping**: Every query to `Progress` or `MissionState` must include a `where: { userId }` clause.
3.  **Strict Level Filtering**: When fetching words by category, ALWAYS include the `level` parameter to prevent cross-level word contamination.
4.  **Simplified State**: No more switching between child profiles. The logged-in user *is* the learner.
5.  **Revalidation**: Call `revalidatePath` from Server Actions ONLY. Never call it directly in client components.

## 🛠️ Common Commands
- `npm run build`: Full production build (Prisma generate + DB push + Next build).
- `npx prisma db push`: Synchronize schema with the database.
- `npm run db:seed`: Restore baseline educational content (Words & Letters).

## ⚠️ Special Instructions for Agents
- **Next.js 16 Compliance**: Do not rename `proxy.ts` to `middleware.ts`.
- **Safe Global Imports**: Import `randomUUID` from `'crypto'`.
- **Redirects**: Rethrow `NEXT_REDIRECT` errors in client components.
- **No Legacy Models**: Do NOT use `ParentAccount` or `ChildProfile`. Use `User` everywhere.
- **Styling Stability**: Avoid `styled-jsx` in client components due to Turbopack incompatibilities. Use standard `<style dangerouslySetInnerHTML={{ __html: ... }} />` for dynamic CSS.

---
*Created to ensure seamless collaboration between agents. Last updated: February 2026*
