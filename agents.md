# Agent Intelligence: English Vocabulary App

This document provides essential context and instructions for AI agents working on this codebase.

## 🚀 Technical Stack
- **Framework**: Next.js 16.1.1 (Turbopack)
- **Language**: TypeScript
- **Database**: Prisma (PostgreSQL in production, SQLite locally)
- **Auth**: NextAuth.js (Google Provider) + Anonymous Session Management
- **Styling**: Tailwind CSS
- **State Management**: Zustand (for client-side UI state)

## 🔐 Authentication & Identity
This app uses a unique hybrid identity system:
- **Anonymous Entry**: Users can start without login. A `deviceId` is generated and stored in a cookie.
- **Identity Provider**: Identity is managed by `proxy.ts` (Next.js 16 convention). Every request must have a `deviceId`.
- **Zero-Friction Upgrade**: When an anonymous user signs in with Google, their `ParentAccount` is upgraded, preserving all child profiles and progress.
- **Privacy Lock**: All data fetching (Children, Progress, etc.) MUST be filtered by the current `parentAccountId`. **Never** return all records without an account filter.

## 📁 Key File Conventions
- **proxy.ts**: Replaced `middleware.ts` for Next.js 16 compliance. Handles `deviceId` generation.
- **lib/auth.ts**: Core authentication logic and privacy helpers.
- **app/actions/auth.ts**: Server actions for starting sessions and PIN management.
- **lib/auth-config.ts**: NextAuth configuration, including the critical `signIn` callback for account merging.
- **prisma/schema.prisma**: Source of truth for the database. Note the `onDelete: Cascade` relationships between parents, children, and progress.

## 🎯 Architectural Principles
1. **Server-First Fetching**: Prioritize server-side data fetching in `page.tsx` components to minimize client-side requests and layout shifts.
2. **Strict Scoping**: Every query to `ChildProfile` or `Progress` must include a `where: { parentAccountId }` or `where: { child: { parentAccountId } }` clause.
3. **Safe Anonymous Access**: Anonymous sessions are full citizens. Treat a `deviceId` as a valid identifier for a `ParentAccount` marked as `isAnonymous: true`.

## 🛠️ Common Commands
- `npm run build`: Full production build (Prisma generate + DB push + Next build).
- `npx prisma db push`: Synchronize schema with the database (prefer over migrations for rapid iteration).
- `npm run db:seed`: Restore baseline educational content (Words & Letters).

## ⚠️ Special Instructions for Agents
- **Next.js 16 Compliance**: Do not rename `proxy.ts` to `middleware.ts`. Use the `proxy` export name.
- **Safe Global Imports**: When using `randomUUID` in server actions, import it from `'crypto'` rather than relying on the global `crypto` object to ensure Node.js compatibility.
- **Redirects**: In client components, ensure `try/catch` blocks around server actions re-throw `NEXT_REDIRECT` errors.

---
*Created to ensure seamless collaboration between agents. Last updated: February 2026*
