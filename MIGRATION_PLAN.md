# Migration Plan: New Authentication System

## Phase 1: Setup Supabase
1. Create Supabase project
2. Set up environment variables
3. Create database schema with RLS rules
4. Configure Supabase Auth (Magic Link + Google OIDC)

## Phase 2: Update Schema
1. Migrate from ParentAccount to Parent model
2. Update ChildProfile (name → nickname, age → age_band)
3. Add ChildData and Event tables
4. Create RLS policies

## Phase 3: Replace Authentication
1. Replace NextAuth with Supabase Auth
2. Implement magic link flow
3. Implement Google OIDC flow
4. Update session handling (HTTP-only cookies)

## Phase 4: Add Parent Gate
1. Create ParentGate component (math question)
2. Create ParentGate component (type-a-word)
3. Protect parent routes with gate
4. Update UI to show gate when needed

## Phase 5: Update Components
1. Update WelcomeScreen
2. Update ChildLoginScreen → ProfilePicker
3. Update ParentPanel
4. Update all child screens

## Phase 6: Add Sync
1. Implement IndexedDB cache
2. Add background sync
3. Implement conflict resolution
4. Add offline indicators

## Phase 7: Testing & Cleanup
1. Test all flows
2. Remove old auth code
3. Update documentation
4. Deploy
