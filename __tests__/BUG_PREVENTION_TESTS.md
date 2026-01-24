# Bug Prevention Tests

This document describes the tests added to prevent recent bugs from reoccurring.

## Tests Added

### 1. `__tests__/actions/prevent-duplicates.test.ts`

**Purpose:** Prevents duplicate server action calls when functions are invoked simultaneously (e.g., React Strict Mode double-invocation).

**Bugs Prevented:**
- **Bug:** `markWordSeen` was called 3 times when clicking "Continue" in learning mode
- **Bug:** `recordQuizAttempt` was called 3 times when clicking the correct answer in quiz mode
- **Bug:** `completeLearningSession` was called 3 times when completing a word set

**How It Works:**
- Tests that when a server action is called 3 times simultaneously, it only hits the database once
- Verifies that the promise cache mechanism correctly deduplicates concurrent calls
- Ensures that React Strict Mode double-invocations don't cause duplicate database operations

**Test Cases:**
1. `markWordSeen` - Should only call `prisma.progress.update` once when called 3 times simultaneously
2. `recordQuizAttempt` - Should only call `prisma.quizAttempt.create` and `prisma.progress.update` once when called 3 times simultaneously
3. `completeLearningSession` - Should only call `prisma.progress.update`, `prisma.missionState.update`, and `prisma.levelState.update` once each when called 3 times simultaneously

### 2. `__tests__/actions/progress.test.ts` (Updated)

**Added Test:** `recordQuizAttempt > should prevent duplicate calls when called simultaneously`

**Purpose:** Ensures that `recordQuizAttempt` doesn't create duplicate quiz attempts when called multiple times concurrently.

## Implementation Details

### Promise Caching

All server actions use module-level promise caches to prevent duplicate calls:

```typescript
// Example from markWordSeen
const markWordSeenCache = new Map<string, Promise<void>>();

export async function markWordSeen(childId: string, wordId: string) {
  const sessionKey = `${childId}-${wordId}`;
  const existingPromise = markWordSeenCache.get(sessionKey);
  if (existingPromise) {
    return existingPromise; // Return cached promise
  }
  
  const promise = (async () => {
    // ... database operations ...
  })();
  
  markWordSeenCache.set(sessionKey, promise);
  return promise;
}
```

### Why These Tests Matter

1. **Performance:** Prevents unnecessary database load from duplicate calls
2. **Data Integrity:** Prevents duplicate records from being created
3. **User Experience:** Prevents UI flickering and unexpected behavior from multiple re-renders
4. **Cost:** Reduces server costs by eliminating redundant operations

## Running the Tests

```bash
# Run all tests
npm test

# Run only duplicate prevention tests
npm test -- --run prevent-duplicates

# Run in watch mode
npm test -- --watch
```

## Related Files

- `app/actions/progress.ts` - Contains `markWordSeen` and `recordQuizAttempt` with promise caching
- `app/actions/learning.ts` - Contains `completeLearningSession` with promise caching
- `__mocks__/prisma.ts` - Mock Prisma client for testing

## Future Improvements

Consider adding tests for:
- Mode switching without page reloads
- Category visibility for level 1 users
- Starter words display in production
- Quiz state preservation when switching modes
