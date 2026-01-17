# Authentication Options - Why Supabase?

## Current Setup: Supabase
- **What it provides**: Google OAuth + Database + RLS
- **Pros**: All-in-one, handles OAuth callbacks, secure
- **Cons**: Extra dependency, requires Supabase account

## Alternative Options

### Option 1: NextAuth.js (Already Installed!)
You already have `next-auth` installed! We can use it instead:

**Pros:**
- Already in your project
- Simple Google OAuth setup
- No external service needed
- Works with your existing Prisma database

**Cons:**
- Need to handle session management yourself

### Option 2: Direct Google OAuth
Use Google OAuth directly without any auth library:

**Pros:**
- Minimal dependencies
- Full control

**Cons:**
- More code to write
- Need to handle tokens, sessions, refresh tokens yourself

### Option 3: Keep Supabase (Current)
**Pros:**
- Handles OAuth callbacks automatically
- Built-in session management (HTTP-only cookies)
- Row Level Security for data isolation
- Can use Supabase database or keep Prisma

**Cons:**
- Requires Supabase account
- Extra service dependency

## Recommendation

Since you want **simple Google login → single child user**, I recommend:

**Option 1: NextAuth.js** (simplest, already installed)
- Use your existing Prisma database
- Simple Google OAuth setup
- No external services needed
- Just need to add `provider_user_id` to child_profiles table

Would you like me to switch to NextAuth.js instead of Supabase?
