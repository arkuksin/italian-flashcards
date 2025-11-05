# Project Overview

## Purpose
Italian Flashcards is a React-based web application for learning Italian-Russian word pairs. The application provides:
- Interactive flashcard interface with bidirectional learning (Russian→Italian and Italian→Russian)
- Progress tracking with Leitner spaced repetition system
- User authentication via Supabase (email and Google OAuth)
- Persistent progress storage in Supabase database
- 300+ word pairs across 30 categories (nouns, verbs, colors, family, numbers, etc.)

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework with dark mode support
- **Framer Motion** - Animations and transitions
- **Lucide React** - Icon library
- **React Router DOM** - Client-side routing

### Backend & Services
- **Supabase** - Authentication and PostgreSQL database
  - Email/password authentication
  - Google OAuth integration
  - User progress storage
  - Learning sessions tracking
- **Vercel** - Hosting and deployment platform

### Testing
- **Playwright** - End-to-end testing framework
- Tests run against both local dev server and Vercel deployments
- Separate test database for safe testing

## Deployment
- **Production**: Vercel (https://italian-flashcards-eight.vercel.app)
- **Preview Deployments**: Automatic for PRs
- **CI/CD**: GitHub Actions for tests and deployment verification
