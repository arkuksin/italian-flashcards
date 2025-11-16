# Code Standards and Conventions

Comprehensive coding standards for the Italian Flashcards project, covering TypeScript, React, styling, and best practices.

## Table of Contents

- [Overview](#overview)
- [TypeScript Standards](#typescript-standards)
- [React Conventions](#react-conventions)
- [Component Patterns](#component-patterns)
- [Styling Guidelines](#styling-guidelines)
- [Naming Conventions](#naming-conventions)
- [File Organization](#file-organization)
- [Code Quality](#code-quality)
- [Best Practices](#best-practices)

## Overview

The project follows modern TypeScript and React best practices with strict typing, functional components, and utility-first CSS via Tailwind.

### Core Principles

1. **Type Safety** - Strict TypeScript with no `any` types
2. **Functional Components** - React hooks over class components
3. **Composition** - Small, reusable components
4. **Clarity** - Readable code over clever code
5. **Consistency** - Follow established patterns
6. **Testing** - Test coverage for critical paths

## TypeScript Standards

### Configuration

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Type Annotations

✅ **DO**: Explicitly type function parameters and return values
```typescript
function calculateAccuracy(correct: number, total: number): number {
  return total > 0 ? (correct / total) * 100 : 0
}
```

❌ **DON'T**: Rely on implicit `any`
```typescript
// BAD
function calculate(a, b) {
  return a / b
}
```

### Interface vs Type

**Prefer interfaces** for object shapes:
```typescript
interface Word {
  id: number
  russian: string
  italian: string
  category: string
}
```

**Use type aliases** for unions, intersections, and utilities:
```typescript
type LearningDirection = 'ru-it' | 'it-ru'
type WordWithProgress = Word & WordProgress
```

### Enums and Const Assertions

**Prefer const assertions** over enums:
```typescript
// Good
const LEARNING_MODES = {
  RU_IT: 'ru-it',
  IT_RU: 'it-ru'
} as const

type LearningMode = typeof LEARNING_MODES[keyof typeof LEARNING_MODES]

// Avoid
enum LearningMode {
  RU_IT = 'ru-it',
  IT_RU = 'it-ru'
}
```

### Null and Undefined

**Always handle nullable values**:
```typescript
// Good
function getWordById(id: number): Word | undefined {
  return words.find(w => w.id === id)
}

const word = getWordById(1)
if (word) {
  console.log(word.russian) // Safe access
}
```

**Use optional chaining and nullish coalescing**:
```typescript
const userName = user?.user_metadata?.name ?? 'Anonymous'
const email = user?.email ?? ''
```

### Generics

**Use generics for reusable components**:
```typescript
interface ApiResponse<T> {
  data: T
  error: string | null
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  // Implementation
}
```

## React Conventions

### Functional Components

**Always use functional components** with hooks:
```typescript
// Good
export function FlashCard({ word }: { word: Word }) {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div>{showAnswer ? word.italian : word.russian}</div>
  )
}

// Avoid class components (legacy)
```

### Props Interface

**Define props interface explicitly**:
```typescript
interface FlashCardProps {
  word: Word
  learningDirection: LearningDirection
  onCorrect: (wordId: number) => void
  onWrong: (wordId: number) => void
  onNext: () => void
}

export function FlashCard({ word, learningDirection, onCorrect, onWrong, onNext }: FlashCardProps) {
  // Component implementation
}
```

### Hooks Usage

**Follow hooks rules**:
```typescript
// ✅ Hooks at top level
function Component() {
  const [count, setCount] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()

  // ... component logic
}

// ❌ Don't call hooks conditionally
function BadComponent() {
  if (someCondition) {
    const [count, setCount] = useState(0) // WRONG!
  }
}
```

**Custom hooks start with `use`**:
```typescript
// Good
export function useProgress() {
  const [progress, setProgress] = useState<ProgressStats>(initialState)

  const recordAnswer = useCallback((wordId: number, correct: boolean) => {
    // Implementation
  }, [])

  return { progress, recordAnswer }
}
```

### Event Handlers

**Prefix with `handle`**:
```typescript
function Form() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleInputChange} />
    </form>
  )
}
```

### State Updates

**Use functional updates for state**:
```typescript
// Good - functional update
setCount(prev => prev + 1)

// Avoid - direct value (can cause stale state)
setCount(count + 1)
```

**Batch related state**:
```typescript
// Good - single state object
const [form, setForm] = useState({
  email: '',
  password: ''
})

// Avoid - too many separate states
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
```

## Component Patterns

### Component Structure

**Consistent component structure**:
```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Component
export function Component({ prop1, prop2 }: Props) {
  // 4. Hooks
  const [state, setState] = useState(initialValue)

  // 5. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies])

  // 6. Event handlers
  const handleClick = () => {
    // Handler logic
  }

  // 7. Render helpers
  const renderContent = () => {
    // Helper logic
  }

  // 8. Return JSX
  return (
    <div>
      {/* Component content */}
    </div>
  )
}
```

### Prop Drilling vs Context

**Use Context for deep props**:
```typescript
// Good - Context for global state
<AuthContext.Provider value={{ user, signIn, signOut }}>
  <App />
</AuthContext.Provider>

// Avoid - Prop drilling 5+ levels deep
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user}>
      <GreatGrandChild user={user} />
    </GrandChild>
  </Child>
</Parent>
```

### Conditional Rendering

**Use clear conditional patterns**:
```typescript
// Good - Early return for simple cases
if (!user) {
  return <LoginPrompt />
}

// Good - Ternary for inline conditions
return showAnswer ? <Answer /> : <Question />

// Good - Logical AND for optional rendering
return (
  <div>
    {error && <ErrorMessage message={error} />}
    {isLoading && <Spinner />}
  </div>
)
```

### Children Props

**Type children correctly**:
```typescript
interface Props {
  children: React.ReactNode // Most flexible
  // OR
  children: React.ReactElement // Single React element
  // OR
  children: string // Just text
}
```

## Styling Guidelines

### Tailwind CSS

**Use utility classes**:
```typescript
// Good - Utility-first approach
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>

// Avoid - Custom CSS (unless absolutely necessary)
<button className="custom-button">Click me</button>
```

**Group related utilities**:
```typescript
// Good - Logical grouping
<div className="
  flex items-center justify-between
  p-4 m-2
  bg-white dark:bg-gray-800
  rounded-lg shadow-md
">
```

**Use responsive modifiers**:
```typescript
<div className="
  w-full
  sm:w-1/2
  md:w-1/3
  lg:w-1/4
">
```

**Dark mode support**:
```typescript
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-white
">
```

### Component-Specific Classes

**Extract repeated patterns**:
```typescript
// Create reusable class strings
const buttonStyles = "px-4 py-2 rounded font-semibold transition-colors"
const primaryButton = `${buttonStyles} bg-blue-500 text-white hover:bg-blue-600`
const secondaryButton = `${buttonStyles} bg-gray-200 text-gray-800 hover:bg-gray-300`

<button className={primaryButton}>Primary</button>
<button className={secondaryButton}>Secondary</button>
```

### Framer Motion

**Use consistent animation patterns**:
```typescript
// Card entry animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {content}
</motion.div>

// Fade in/out
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {content}
</motion.div>
```

## Naming Conventions

### Files and Folders

**Components**: PascalCase
```
FlashCard.tsx
UserProfile.tsx
ProgressBar.tsx
```

**Utilities and helpers**: camelCase
```
emailValidator.ts
wordService.ts
supabase.ts
```

**Constants**: UPPER_SNAKE_CASE (in files)
```
// constants.ts
export const MAX_STREAK = 100
export const DEFAULT_MASTERY_LEVEL = 0
```

**Types/Interfaces**: PascalCase
```
types/index.ts
database-types.ts
```

### Variables and Functions

**Variables**: camelCase
```typescript
const userName = 'John'
const isLoggedIn = true
const wordCount = 300
```

**Functions**: camelCase, verb-first
```typescript
function calculateAccuracy() {}
function fetchWords() {}
function validateEmail() {}
```

**Boolean variables**: Prefix with `is`, `has`, `should`
```typescript
const isLoading = false
const hasError = false
const shouldShowAnswer = true
```

**Event handlers**: Prefix with `handle`
```typescript
const handleClick = () => {}
const handleSubmit = () => {}
const handleChange = () => {}
```

### Components

**Components**: PascalCase
```typescript
function FlashCard() {}
function UserProfile() {}
function ProgressBar() {}
```

**Component files**: Match component name
```
FlashCard.tsx  // exports FlashCard component
UserProfile.tsx  // exports UserProfile component
```

### Constants

**Use UPPER_SNAKE_CASE for true constants**:
```typescript
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRY_ATTEMPTS = 3
const DEFAULT_TIMEOUT_MS = 5000
```

## File Organization

### Project Structure

```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── ui/              # Reusable UI components
│   └── [Feature].tsx    # Feature-specific components
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── pages/               # Route-level page components
├── services/            # Business logic and API calls
├── lib/                 # Utility functions and configurations
├── data/                # Static data
├── types/               # TypeScript type definitions
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

### Import Order

**Consistent import organization**:
```typescript
// 1. External libraries
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// 2. Internal modules (absolute imports)
import { useAuth } from '@/contexts/AuthContext'
import { Word } from '@/types'

// 3. Relative imports
import { Button } from '../ui/Button'
import { validateEmail } from './utils'

// 4. Styles (if any)
import './Component.css'
```

### Barrel Exports

**Use index files for clean imports**:
```typescript
// components/ui/index.ts
export { Button } from './Button'
export { Input } from './Input'
export { Card } from './Card'

// Usage
import { Button, Input, Card } from '@/components/ui'
```

## Code Quality

### ESLint Configuration

**File**: `.eslintrc.cjs`

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react/react-in-jsx-scope': 'off', // Not needed in React 18
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
```

### Code Comments

**When to comment**:
```typescript
// ✅ Complex logic that needs explanation
// Calculate new mastery level using Leitner system
// Correct answer: level up (max 5)
// Wrong answer: level down (min 0)
const newLevel = correct
  ? Math.min(currentLevel + 1, 5)
  : Math.max(currentLevel - 1, 0)

// ✅ Non-obvious business rules
// Email validator blocks 14 throwaway domains to prevent
// bounce rate increases that would restrict Supabase email sending
if (!isValidEmail(email)) {
  throw new Error('Invalid email domain')
}

// ❌ Self-evident code
// BAD: Don't state the obvious
const count = 0 // Initialize count to zero
```

**Use JSDoc for public APIs**:
```typescript
/**
 * Calculates user's accuracy percentage
 * @param correct - Number of correct answers
 * @param total - Total number of attempts
 * @returns Accuracy as percentage (0-100)
 */
export function calculateAccuracy(correct: number, total: number): number {
  return total > 0 ? (correct / total) * 100 : 0
}
```

### Error Handling

**Always handle errors explicitly**:
```typescript
// Good - Explicit error handling
try {
  const { data, error } = await supabase.from('words').select('*')

  if (error) {
    console.error('Failed to fetch words:', error)
    throw new Error('Could not load words')
  }

  return data
} catch (err) {
  // Handle error appropriately
  showErrorToast('Failed to load flashcards')
}
```

**Type errors properly**:
```typescript
// Good - Typed error
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('Unknown error:', error)
  }
}
```

### Performance

**Memoize expensive computations**:
```typescript
import { useMemo } from 'react'

const expensiveValue = useMemo(() => {
  return words.filter(w => w.category === category)
}, [words, category])
```

**Memoize callbacks**:
```typescript
import { useCallback } from 'react'

const handleClick = useCallback(() => {
  doSomething(value)
}, [value])
```

**Lazy load routes** (planned):
```typescript
import { lazy } from 'react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
```

## Best Practices

### Do's and Don'ts

✅ **DO**:
- Write small, focused components (< 200 lines)
- Use TypeScript strict mode
- Test critical user paths
- Handle loading and error states
- Use semantic HTML
- Add ARIA labels for accessibility
- Follow consistent naming conventions
- Document complex logic
- Keep functions pure when possible
- Extract reusable logic into hooks

❌ **DON'T**:
- Use `any` type (use `unknown` if needed)
- Mutate state directly
- Skip error handling
- Forget loading states
- Inline complex logic in JSX
- Create deeply nested components
- Use magic numbers (extract to constants)
- Copy-paste code (create reusable utilities)
- Ignore TypeScript errors
- Commit commented-out code

### Code Review Checklist

Before submitting PR:
- [ ] TypeScript types are explicit and correct
- [ ] No `any` types used
- [ ] Components follow naming conventions
- [ ] Props interfaces are defined
- [ ] Error handling is present
- [ ] Loading states are handled
- [ ] Tests added for new features
- [ ] ESLint passes with no warnings
- [ ] Build succeeds locally
- [ ] Dark mode works (if applicable)
- [ ] Responsive design tested
- [ ] Accessibility considered

### Testing Standards

**Test file naming**:
```
Component.spec.ts  // Unit tests
Component.test.tsx  // Component tests
feature.spec.ts  // E2E tests (in e2e/ directory)
```

**Test structure**:
```typescript
describe('Component', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { /* test props */ }

    // Act
    render(<Component {...props} />)

    // Assert
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    // Test user interaction
  })
})
```

## Related Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Component structure and patterns
- **[Testing Guide](./TESTING.md)** - Testing strategies
- **[Database Guide](./DATABASE.md)** - Database query patterns
- **[Authentication Guide](./AUTHENTICATION.md)** - Auth patterns

## Additional Resources

- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript documentation
- **[React Documentation](https://react.dev/)** - Official React docs
- **[Tailwind CSS Docs](https://tailwindcss.com/docs)** - Tailwind documentation
- **[ESLint Rules](https://eslint.org/docs/rules/)** - ESLint rule reference

---

**Last Updated**: 2025-10-30
**Maintainer**: Development team with Claude Code assistance
**Linter**: ESLint with TypeScript plugin
