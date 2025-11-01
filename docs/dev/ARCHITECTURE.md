# Architecture Documentation

This document provides a comprehensive overview of the Italian Flashcards application architecture, component structure, state management, and data flow patterns.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Application Entry Point](#application-entry-point)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Data Flow](#data-flow)
- [Routing](#routing)
- [Styling System](#styling-system)
- [Type System](#type-system)

## Overview

The Italian Flashcards application is a React-based single-page application (SPA) that helps users learn Russian-Italian word pairs through interactive flashcards. The application features:

- Interactive flashcard interface with multiple learning modes
- Progress tracking using Leitner spaced repetition system
- User authentication with Supabase (email/password + Google OAuth)
- Persistent progress tracking stored in Supabase database
- Modern, responsive UI with dark mode support

## Technology Stack

### Core Framework
- **React 18** - UI library with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for smooth transitions
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password, Google OAuth)
  - Row Level Security (RLS) for data protection

### Testing
- **Playwright** - End-to-end testing framework
- **Vitest** (planned) - Unit testing framework

### Build & Development
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Vercel** - Deployment platform

## Project Structure

```
italian-flashcards/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication-related components
│   │   └── ui/             # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route-level page components
│   ├── services/           # Business logic and API calls
│   ├── lib/                # Utility functions and configurations
│   ├── data/               # Static data (word lists)
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── e2e/                    # Playwright E2E tests
├── scripts/                # Utility scripts (22 automation scripts)
├── docs/                   # Documentation
├── .claude/                # Claude Code configuration
│   ├── agents/            # Specialized AI agents
│   ├── skills/            # Reusable AI skills
│   └── commands/          # Custom slash commands
└── public/                 # Static assets
```

## Application Entry Point

### main.tsx

Entry point that renders the root React component:

```typescript
src/main.tsx
├── Imports React and ReactDOM
├── Imports global styles (index.css)
├── Renders <App /> component into #root element
└── Uses React.StrictMode for development checks
```

**Key Responsibilities**:
- Mount React application to DOM
- Apply global styles
- Enable strict mode checks

## Component Architecture

The application follows a component-based architecture with clear separation of concerns:

### Core Application Components

#### App.tsx
The main orchestrator component that handles:
- Route configuration
- Global state initialization
- Authentication state management
- Layout structure

**Location**: `src/App.tsx`

### Page Components

#### Dashboard.tsx
Main learning interface containing:
- `<ModeSelection />` - Learning direction selector
- `<FlashCard />` - Interactive flashcard
- `<ProgressBar />` - Progress visualization
- `<Statistics />` - Performance metrics

**Location**: `src/pages/Dashboard.tsx`

#### Login.tsx
Authentication page with:
- `<LoginForm />` - Email/password login
- Google OAuth button
- Registration flow

**Location**: `src/pages/Login.tsx`

#### Callback.tsx
OAuth callback handler for Google authentication

**Location**: `src/pages/Callback.tsx`

#### PrivacyPolicy.tsx
Privacy policy page (required for Google OAuth)

**Location**: `src/pages/PrivacyPolicy.tsx`

### Feature Components

#### ModeSelection
**Purpose**: Initial learning direction selection

**Location**: `src/components/ModeSelection.tsx`

**Features**:
- Choose Russian → Italian or Italian → Russian
- Visual mode cards with icons
- Framer Motion animations

**Props**:
```typescript
{
  onSelectMode: (direction: LearningDirection) => void
}
```

#### Header
**Purpose**: Navigation bar with global controls

**Location**: `src/components/Header.tsx`

**Features**:
- Dark mode toggle
- Shuffle mode toggle
- Learning direction switcher
- Restart session button
- User profile menu (when authenticated)

**State**: Manages dark mode, shuffle mode preferences

#### FlashCard
**Purpose**: Main flashcard interface for word learning

**Location**: `src/components/FlashCard.tsx`

**Features**:
- Display source word
- Text input for answer
- Answer validation (case-insensitive, trimmed)
- Answer reveal with visual feedback
- Keyboard navigation (Enter to submit)
- Framer Motion card flip animation

**Props**:
```typescript
{
  word: Word
  learningDirection: LearningDirection
  onCorrect: (wordId: number) => void
  onWrong: (wordId: number) => void
  onNext: () => void
}
```

#### ProgressBar
**Purpose**: Visual progress tracking sidebar

**Location**: `src/components/ProgressBar.tsx`

**Features**:
- Progress percentage
- Correct/wrong answer counts
- Current streak indicator
- Visual progress bar

**Props**:
```typescript
{
  progress: ProgressStats
}
```

#### Statistics
**Purpose**: Detailed performance metrics display

**Location**: `src/components/Statistics.tsx`

**Features**:
- Total words studied
- Accuracy percentage
- Current and longest streak
- Mastered words count
- Words in progress

**Props**:
```typescript
{
  stats: ProgressStats
}
```

### Authentication Components

#### LoginForm
**Purpose**: Email/password authentication form

**Location**: `src/components/auth/LoginForm.tsx`

**Features**:
- Email/password input with validation
- Email format validation (blocks throwaway domains)
- Switch between login/register modes
- Form validation and error handling
- Google OAuth button

**Important**: Includes email validation to prevent throwaway domains that cause email bounces

#### UserProfile
**Purpose**: User profile dropdown menu

**Location**: `src/components/auth/UserProfile.tsx`

**Features**:
- User avatar/name display
- Logout button
- Profile management (planned)

#### ProtectedRoute
**Purpose**: Route guard for authenticated pages

**Location**: `src/components/ProtectedRoute.tsx`

**Features**:
- Check authentication status
- Redirect to login if not authenticated
- Show loading state during auth check

### UI Components

#### LoadingSpinner
**Purpose**: Reusable loading indicator

**Location**: `src/components/ui/LoadingSpinner.tsx`

**Features**:
- Animated spinner
- Customizable size and color

## State Management

The application uses a hybrid state management approach:

### 1. React Context API

#### AuthContext
**Purpose**: Global authentication state

**Location**: `src/contexts/AuthContext.tsx`

**Provides**:
```typescript
{
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}
```

**Key Responsibilities**:
- Manage Supabase authentication session
- Handle sign in/up/out operations
- Google OAuth flow
- Session persistence
- Authentication state synchronization

### 2. Custom Hooks

#### useProgress
**Purpose**: Progress tracking and persistence

**Location**: `src/hooks/useProgress.tsx`

**Features**:
- Track correct/wrong answers
- Calculate accuracy and streaks
- Persist progress to Supabase database
- Leitner spaced repetition system
- Mastery level tracking (0-5)

**Returns**:
```typescript
{
  progress: ProgressStats
  recordAnswer: (wordId: number, correct: boolean) => void
  resetProgress: () => void
}
```

#### useKeyboard
**Purpose**: Keyboard shortcut handling

**Location**: `src/hooks/useKeyboard.ts`

**Features**:
- Arrow key navigation
- Enter key submission
- Escape key actions
- Custom key bindings

**Usage**:
```typescript
useKeyboard({
  onEnter: handleSubmit,
  onArrowLeft: previousWord,
  onArrowRight: nextWord,
  onEscape: clearInput
})
```

### 3. Local Component State

- `useState` for component-specific state (input values, UI toggles)
- `useReducer` for complex state logic (planned for flashcard quiz state)

## Data Flow

### Authentication Flow

```
1. User visits app
   ↓
2. AuthContext checks for existing session
   ↓
3a. If authenticated → Dashboard
3b. If not authenticated → Login page
   ↓
4. User signs in (email/password or Google OAuth)
   ↓
5. Supabase handles authentication
   ↓
6. Session created and stored
   ↓
7. AuthContext updates user state
   ↓
8. Redirect to Dashboard
```

### Learning Session Flow

```
1. User selects learning direction (ru-it or it-ru)
   ↓
2. wordService fetches words from Supabase
   ↓
3. Dashboard loads words and user progress
   ↓
4. FlashCard displays first word
   ↓
5. User types answer and submits
   ↓
6. Answer validated (case-insensitive)
   ↓
7a. Correct → useProgress updates mastery level up
7b. Wrong → useProgress updates mastery level (may decrease)
   ↓
8. Progress persisted to Supabase (user_progress table)
   ↓
9. Next word loaded based on Leitner system priority
   ↓
10. Repeat steps 4-9 until session complete
```

### Progress Tracking Flow

```
User answers flashcard
   ↓
recordAnswer(wordId, correct)
   ↓
Update local state (streak, counts)
   ↓
Calculate new mastery level (Leitner system)
   ↓
Persist to Supabase (user_progress table)
   ↓
Update UI (ProgressBar, Statistics)
```

## Routing

Currently using browser navigation (planned: React Router or TanStack Router):

### Routes

- `/` - Dashboard (protected, requires auth)
- `/login` - Login/register page
- `/callback` - OAuth callback handler
- `/privacy` - Privacy policy page

### Protected Routes

Protected routes use the `<ProtectedRoute>` component wrapper that:
1. Checks authentication status via AuthContext
2. Shows loading spinner during auth check
3. Redirects to `/login` if not authenticated
4. Renders children if authenticated

## Styling System

### Tailwind CSS

**Configuration**: `tailwind.config.js`

**Key Features**:
- Utility-first approach
- Dark mode support (`dark:` variant)
- Custom color palette
- Responsive breakpoints
- Component-specific utilities

**Dark Mode**:
- Stored in localStorage
- Applied via `dark` class on root element
- All components support dark mode variants

### Framer Motion

**Usage**: Component animations and transitions

**Key Animations**:
- Flashcard entry/exit animations
- Mode selection card animations
- Answer feedback animations
- Page transitions

**Example**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

## Type System

### Core Types

**Location**: `src/types/index.ts`

#### Word
```typescript
interface Word {
  id: number
  russian: string
  italian: string
  category: string
  created_at?: string
}
```

#### AppState
```typescript
interface AppState {
  currentWordIndex: number
  userInput: string
  showAnswer: boolean
  learningDirection: LearningDirection
  darkMode: boolean
  shuffleMode: boolean
}
```

#### ProgressStats
```typescript
interface ProgressStats {
  totalWordsStudied: number
  totalAttempts: number
  correctAnswers: number
  accuracy: number
  currentStreak: number
  longestStreak: number
  masteredWords: number
  wordsInProgress: number
}
```

#### WordProgress (Database Integration)
```typescript
interface WordProgress {
  id: string
  user_id: string
  word_id: number
  correct_count: number
  wrong_count: number
  last_practiced: string
  mastery_level: number // 0-5 (Leitner System)
}
```

### Database Types

**Location**: `src/lib/database-types.ts`

Generated from Supabase schema:
- Auto-generated TypeScript types
- Keeps types in sync with database schema
- Provides type safety for Supabase queries

**Regenerate**: Run `npm run types:generate` when schema changes

## Data Sources

### Static Data (Legacy)

**Location**: `src/data/words.ts`

300 Russian-Italian word pairs organized by 30 categories. This is legacy data that's now stored in Supabase but kept for reference.

### Database (Current)

**Tables**:
- `words` - Word pairs (300+ words)
- `user_progress` - Individual word progress per user
- `learning_sessions` - Session tracking and statistics

**See**: [docs/dev/DATABASE.md](./DATABASE.md) for detailed database documentation

## Services

### wordService

**Location**: `src/services/wordService.ts`

**Purpose**: Centralized word data management

**Key Functions**:
```typescript
// Fetch all words from database
async function getAllWords(): Promise<Word[]>

// Fetch words by category
async function getWordsByCategory(category: string): Promise<Word[]>

// Shuffle words array
function shuffleWords(words: Word[]): Word[]

// Get user's progress for specific word
async function getUserWordProgress(userId: string, wordId: number): Promise<WordProgress>

// Update word progress after answer
async function updateWordProgress(userId: string, wordId: number, correct: boolean): Promise<void>
```

## Performance Considerations

### Code Splitting
- Routes lazy-loaded (planned with React Router)
- Component-level code splitting where appropriate

### Optimization
- Memoization of expensive computations
- Virtual scrolling for long word lists (planned)
- Image optimization (if needed in future)

### Bundle Size
- Tailwind CSS purging unused styles
- Lucide React tree-shaking
- Vite's built-in optimizations

## Future Architecture Improvements

### Planned Enhancements
1. **State Management**: Consider Zustand or Jotai for global state
2. **Routing**: Implement TanStack Router with file-based routing
3. **API Layer**: Create unified API service layer
4. **Caching**: Implement React Query for server state management
5. **PWA**: Add service worker for offline support
6. **Performance**: Implement virtual scrolling for word lists
7. **Testing**: Add component unit tests with Vitest

### Technical Debt
- [ ] Refactor App.tsx to be smaller and more focused
- [ ] Extract reusable form components
- [ ] Standardize error handling patterns
- [ ] Add comprehensive TypeScript types for all components
- [ ] Implement proper loading states everywhere

## Related Documentation

- **[Testing Guide](./TESTING.md)** - Testing strategies and E2E tests
- **[Database Guide](./DATABASE.md)** - Supabase schema and queries
- **[Authentication Guide](./AUTHENTICATION.md)** - Auth flows and security
- **[Code Standards](./CODE_STANDARDS.md)** - TypeScript and React conventions
- **[Deployment Guide](./DEPLOYMENT.md)** - Vercel deployment and CI/CD

---

**Last Updated**: 2025-10-30
**Maintainer**: Development team with Claude Code assistance
