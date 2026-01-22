# Testing Guide

This project uses **Vitest** for unit testing with **React Testing Library** for component testing.

## Setup

Tests are configured in:
- `vitest.config.ts` - Vitest configuration
- `vitest.setup.ts` - Test setup and global mocks
- `__mocks__/prisma.ts` - Prisma client mock

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
__tests__/
├── actions/          # Server action tests
│   ├── auth.test.ts
│   ├── children.test.ts
│   ├── levels.test.ts
│   ├── letters.test.ts
│   ├── words.test.ts
│   ├── progress.test.ts
│   ├── plans.test.ts
│   ├── settings.test.ts
│   └── streak.test.ts
├── components/       # Component tests
│   ├── ChildSwitcher.test.tsx
│   └── LearnLetters.test.tsx
└── lib/             # Utility tests
    └── utils.test.ts
```

## Test Coverage

### Server Actions (✅ 44/51 tests passing)
- **Auth**: PIN verification, PIN setting
- **Children**: CRUD operations, active child management
- **Levels**: XP system, level progression
- **Letters**: Letter learning, mastery tracking
- **Words**: Word management, filtering by level
- **Progress**: Learning progress, quiz attempts
- **Plans**: Daily plan generation
- **Settings**: App settings management
- **Streak**: Streak calculation

### Components
- **ChildSwitcher**: Child switching UI
- **LearnLetters**: Letter learning interface

### Utilities
- Date formatting functions

## Mocking

### Prisma Client
The Prisma client is mocked in `__mocks__/prisma.ts` to avoid database dependencies in tests.

### Next.js
- Router (`next/navigation`) - mocked
- Cache (`next/cache`) - `revalidatePath` mocked
- Auth (`next-auth`) - session mocked

### External APIs
- Web Speech API - mocked
- bcrypt - mocked for password hashing

## Writing New Tests

### Server Action Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myAction } from '@/app/actions/my-action';
import { prisma } from '@/__mocks__/prisma';

describe('My Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    (prisma.model.findMany as any).mockResolvedValue([...]);
    
    const result = await myAction();
    expect(result).toBeDefined();
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '@/components/MyComponent';

vi.mock('@/app/actions/my-action', () => ({
  myAction: vi.fn(),
}));

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Mock external dependencies**: Database, APIs, etc.
3. **Test behavior, not implementation**: Focus on what the code does, not how
4. **Use descriptive test names**: `should return user when email exists`
5. **Clean up**: Use `beforeEach` to reset mocks

## Known Issues

Some tests may fail due to:
- Next.js static generation context in tests
- Complex async flows requiring better mocking
- Component rendering timing issues

These are being addressed incrementally.
