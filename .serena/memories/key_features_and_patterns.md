# Key Features and Design Patterns

## Application Features

### Learning System
- **Bidirectional Learning**: Russian→Italian and Italian→Russian modes
- **Spaced Repetition**: Leitner system implementation (5 mastery levels)
- **300+ Word Pairs**: Organized into 30 categories
- **Progress Tracking**: Persistent tracking via Supabase database
- **Shuffle Mode**: Randomized word order for varied practice
- **Keyboard Navigation**: Full keyboard shortcut support

### User Experience
- **Dark/Light Mode**: Theme toggle with localStorage persistence
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Framer Motion for flashcard transitions
- **Visual Progress**: Real-time statistics and progress bar
- **Instant Feedback**: Immediate correct/wrong answer indication

### Authentication & User Management
- **Email/Password Auth**: Standard authentication via Supabase
- **Google OAuth**: Social login integration
- **Protected Routes**: Route guards for authenticated content
- **User Profiles**: Display user info and progress stats
- **Session Management**: Persistent sessions with automatic refresh

### Data Persistence
- **User Progress**: Per-word mastery levels and statistics
- **Learning Sessions**: Track study sessions with timestamps
- **Global Statistics**: Total words studied, accuracy rates, streaks
- **Database Schema**: PostgreSQL via Supabase with RLS policies

## Design Patterns

### Component Architecture
```
Pattern: Container/Presentational Components
- Smart containers: Handle state and business logic
- Presentational: Pure display components
- Clear separation of concerns
```

### State Management
```
Pattern: Context + Hooks
- AuthContext: Global authentication state
- useProgress: Custom hook for progress tracking
- Local state: Component-level state with useState
- No Redux or external state management (keeping it simple)
```

### Custom Hooks
```
Pattern: Encapsulate Reusable Logic
- useKeyboard: Keyboard event handling
- useProgress: Progress tracking and Leitner algorithm
- Benefits: Reusability, testability, separation of concerns
```

### Route Protection
```
Pattern: Higher-Order Component (ProtectedRoute)
- Wraps routes requiring authentication
- Redirects unauthenticated users to login
- Centralized auth checking logic
```

### Type Safety
```
Pattern: TypeScript First
- Strict mode enabled
- Interface definitions for all data structures
- Generated types from Supabase schema
- No 'any' types (enforced by linter)
```

### Service Layer
```
Pattern: Service Objects
- wordService: Abstracts data fetching
- Database operations isolated from UI
- Easy to mock for testing
- Single source of truth for data operations
```

### Environment Configuration
```
Pattern: Validated Environment Variables
- env.ts: Centralized validation
- Type-safe environment access
- Fails fast on missing required vars
- Separate configs for dev/test/production
```

## Code Organization Patterns

### Import Order Convention
1. External dependencies (React, libraries)
2. Internal components
3. Hooks and contexts
4. Types and interfaces
5. Utilities and helpers
6. Styles

### File Naming
- **Components**: PascalCase.tsx
- **Hooks**: camelCase.ts with 'use' prefix
- **Utils**: camelCase.ts
- **Types**: lowercase.ts
- **Pages**: PascalCase.tsx

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { ComponentProps } from './types';

// 2. Type definitions
interface Props { ... }

// 3. Component definition
export default function Component({ props }: Props) {
  // 3a. Hooks
  const [state, setState] = useState();
  
  // 3b. Event handlers
  const handleClick = () => { ... };
  
  // 3c. Derived values
  const computed = ...;
  
  // 3d. JSX return
  return <div>...</div>;
}
```

## Security Patterns

### Email Validation
```
Pattern: Whitelist/Blacklist Validation
- Blocks throwaway email domains
- Prevents email bounce rate issues
- Centralized in emailValidator.ts
- Applied at form validation level
```

### Branch Protection
```
Pattern: CI/CD with Required Checks
- PR reviews required for main branch
- E2E tests must pass before merge
- Automated deployment verification
- Status checks in GitHub Actions
```

### Environment Separation
```
Pattern: Multiple Environment Configs
- Test database for development
- Production database isolated
- Separate Supabase projects
- Prevents accidental production changes
```

### Database Security
```
Pattern: Row-Level Security (RLS)
- Supabase RLS policies on all tables
- Users can only access their own data
- Database-enforced security
- No trust in client-side validation
```

## Testing Patterns

### E2E Testing with Playwright
```
Pattern: Real Environment Testing
- Tests against actual Supabase backend
- Uses dedicated test database
- Separate test user accounts
- Cleanup scripts for test data
```

### Test Organization
```
e2e/
├── smoke-test-production.spec.ts   # Production health checks
├── real-auth.spec.ts               # Authentication flows
└── *.spec.ts                       # Feature-specific tests
```

## Performance Patterns

### Lazy Loading
```
Pattern: Code Splitting
- React Router handles route-based splitting
- Vite automatically chunks dependencies
- Icons excluded from optimization (lucide-react)
```

### Caching Strategy
```
Pattern: Browser + Service Worker
- Static assets cached by Vercel
- API responses cached by Supabase
- localStorage for theme preferences
```

## Deployment Patterns

### Continuous Deployment
```
Pattern: Git-Based Deployment
- Push to main → Production deploy (Vercel)
- Push to feature branch → Preview deploy
- GitHub Actions → Run tests
- Automated health checks post-deploy
```
