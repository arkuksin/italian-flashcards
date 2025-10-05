# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based Italian flashcards application that helps users learn Russian-Italian word pairs. The application features an interactive flashcard interface with progress tracking, multiple learning modes, and a modern UI built with Tailwind CSS and Framer Motion.

## Key Commands

### Development
- `npm run dev` - Start the development server (Vite)
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues

### Testing
- `npm run test:e2e` - Run Playwright end-to-end tests
- The e2e tests are configured to run against `http://localhost:5173`

### Branch Protection & Security
- `npm run setup:branch-protection` - Configure GitHub branch protection for main branch
- `npm run verify:branch-protection` - Verify branch protection configuration
- See `docs/branch-protection.md` for detailed setup and security guidelines

### Platform-specific Development Servers
- `./start-linux.sh` - Start development server on Linux
- `./start-windows.ps1` - Start development server on Windows (PowerShell)

## Architecture

### Core Application Structure
- **Entry Point**: `src/main.tsx` renders the main App component
- **Main Component**: `src/App.tsx` contains the primary application logic and state management
- **Component Architecture**: Uses a modular component-based structure with clear separation of concerns

### Key Components
- **ModeSelection** (`src/components/ModeSelection.tsx`): Initial learning direction selection (Russian→Italian or Italian→Russian)
- **Header** (`src/components/Header.tsx`): Navigation bar with controls for dark mode, shuffle, direction toggle, and restart
- **FlashCard** (`src/components/FlashCard.tsx`): Main flashcard interface for word learning
- **ProgressBar** (`src/components/ProgressBar.tsx`): Visual progress tracking sidebar

### Data Management
- **Words Dataset**: `src/data/words.ts` contains 300 Russian-Italian word pairs organized by categories
- **Categories**: nouns, verbs, colors, family, numbers, time, body, animals, weather, adjectives, transport, places, food, clothing, common, objects, emotions, professions, sports, nature, arts, entertainment, communication, events, health, directions, days, months, seasons, location
- **Shuffle Function**: `getShuffledWords()` provides randomized word order

### State Management
- **AppState Interface**: Defined in `src/types/index.ts` with:
  - `currentWordIndex`: Current position in word array
  - `userInput`: User's typed answer
  - `showAnswer`: Whether to reveal the correct answer
  - `progress`: Tracking correct/wrong answers and streaks
  - `learningDirection`: 'ru-it' or 'it-ru'
  - `darkMode`: UI theme toggle
  - `shuffleMode`: Random word order toggle

### Hooks
- **useKeyboard** (`src/hooks/useKeyboard.ts`): Custom hook for keyboard shortcuts and navigation

### Styling and UI
- **Tailwind CSS**: Primary styling framework with dark mode support
- **Framer Motion**: Animations and transitions between flashcards
- **Dark Mode**: Persistent theme stored in localStorage

## Features

### Learning Modes
- **Russian → Italian**: Learn Italian translations of Russian words
- **Italian → Russian**: Learn Russian translations of Italian words
- **Bidirectional Support**: Switch between modes during learning

### Progress Tracking
- **Statistics**: Correct/wrong answer counts and current streak
- **Completion Tracking**: Set of completed word IDs
- **Visual Progress**: Progress bar showing current position and statistics

### User Experience
- **Keyboard Navigation**: Arrow keys, Enter for submit, and various shortcuts
- **Shuffle Mode**: Randomize word order for varied practice
- **Dark/Light Theme**: Persistent theme preference
- **Responsive Design**: Works on mobile and desktop

## Development Notes

### Technology Stack
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Playwright** for end-to-end testing

### Build Configuration
- **Base Path**: Configured for both Vercel (`/`) and GitHub Pages (`/italian-flashcards/`)
- **Optimizations**: Excludes `lucide-react` from dependency optimization

### Testing Setup
- **Playwright Config**: Located in `playwright.config.ts`
- **Test Directory**: `e2e/` contains end-to-end tests
- **Test Server**: Automatically starts dev server on port 5173
- **Create new test, if new code is added**: Add a new test file to `e2e/`, if you think it is necessary.

### E2E Authentication Testing
- **Complete Guide**: See `docs/E2E_AUTHENTICATION_TESTING.md` for comprehensive documentation
- **Quick Summary**:
  - Uses real Supabase authentication with separate test database
  - Tests run against Vercel Preview deployments in CI
  - Test user: `test-e2e@example.com` / `TestPassword123!`
  - All 8 authentication tests passing as of 2025-10-04
- **Key Files**:
  - Tests: `e2e/real-auth.spec.ts`
  - Workflow: `.github/workflows/pr-e2e-tests.yml`
  - Auth Context: `src/contexts/AuthContext.tsx`

### Code Style
- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Strict configuration with separate configs for app and node environments

## Data Structure

### Word Interface
```typescript
interface Word {
  id: number;
  russian: string;
  italian: string;
  category?: string;
}
```

### Learning State
- Progress is tracked per session but not persisted between browser sessions
- Dark mode preference is stored in localStorage
- No user authentication or cloud storage currently implemented

# Communication Style

Always communicate in simple, clear English:
- Use short, straightforward sentences
- Explain technical terms when you must use them
- Use plain language instead of complex vocabulary
- Keep explanations concise and easy to understand

## Future Development Considerations

The project includes a detailed plan (`plan.md`) for backend integration with Supabase, user authentication, and persistent progress tracking. This plan outlines migration to a full-stack architecture with user accounts and database storage.