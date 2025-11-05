# Codebase Structure

## Root Directory Structure
```
italian-flashcards/
├── .github/workflows/      # GitHub Actions CI/CD workflows
├── .codex/                 # Codex configuration
├── .serena/                # Serena MCP configuration
├── cleanup/                # Database cleanup scripts and logs
├── docs/                   # Project documentation
├── e2e/                    # Playwright E2E tests
├── mcp-github-tools/       # MCP server for GitHub operations
├── mcp-supabase/           # MCP server for Supabase operations
├── mcp-vercel-tools/       # MCP server for Vercel operations
├── plan/                   # Architecture and planning documents
├── public/                 # Static assets
├── scripts/                # Node.js utility scripts
├── src/                    # Source code (see below)
├── supabase/               # Supabase migrations and types
└── dist/                   # Build output (generated)
```

## Source Code Structure (`src/`)
```
src/
├── App.tsx                 # Main application component with routing
├── main.tsx                # Application entry point
├── index.css               # Global styles (Tailwind imports)
│
├── components/             # React components
│   ├── FlashCard.tsx       # Main flashcard interface
│   ├── Header.tsx          # Navigation bar with controls
│   ├── ModeSelection.tsx   # Learning direction selection
│   ├── ProgressBar.tsx     # Visual progress tracking sidebar
│   ├── ProtectedRoute.tsx  # Route protection wrapper
│   ├── auth/               # Authentication components
│   │   ├── LoginForm.tsx   # Email/password and OAuth login
│   │   └── UserProfile.tsx # User profile display
│   └── ui/                 # Reusable UI components
│       └── LoadingSpinner.tsx
│
├── contexts/               # React contexts
│   └── AuthContext.tsx     # Authentication state and methods
│
├── data/                   # Static data
│   └── words.ts            # 300+ Russian-Italian word pairs
│
├── hooks/                  # Custom React hooks
│   ├── useKeyboard.ts      # Keyboard shortcuts and navigation
│   └── useProgress.ts      # Progress tracking with Leitner system
│
├── lib/                    # Library utilities and configurations
│   ├── database-types.ts   # Generated Supabase types
│   ├── database.ts         # Database helper functions
│   ├── emailValidator.ts   # Email validation (prevents bounces)
│   ├── env.ts              # Environment variable validation
│   └── supabase.ts         # Supabase client configuration
│
├── pages/                  # Page components
│   ├── Callback.tsx        # OAuth callback handler
│   ├── Dashboard.tsx       # Main learning dashboard
│   └── Login.tsx           # Login page
│
├── services/               # Business logic and API services
│   └── wordService.ts      # Word fetching and management
│
├── types/                  # TypeScript type definitions
│   └── index.ts            # Core application types
│
└── utils/                  # Helper functions
    └── spacedRepetition.ts # Leitner spaced repetition algorithm
```

## Configuration Files
```
eslint.config.js            # ESLint configuration (flat config)
playwright.config.ts        # Playwright E2E test configuration
postcss.config.js           # PostCSS configuration
tailwind.config.js          # Tailwind CSS configuration
tsconfig.json               # TypeScript configuration (root)
tsconfig.app.json           # TypeScript config for app code
tsconfig.node.json          # TypeScript config for Node.js scripts
vite.config.ts              # Vite build configuration
vercel.json                 # Vercel deployment configuration
```

## Environment Files
```
.env.local                  # Local development (test database)
.env.test.local             # Local E2E testing
.env.production.local       # Production database (careful!)
.env.example                # Example environment variables
```

## Key Entry Points
1. **Browser**: `index.html` → `src/main.tsx` → `src/App.tsx`
2. **Tests**: `playwright.config.ts` → `e2e/*.spec.ts`
3. **Build**: `vite.config.ts` → `dist/`

## Data Flow
1. User authenticates via Supabase (AuthContext)
2. Dashboard page loads words from wordService
3. FlashCard component displays current word
4. useProgress hook tracks learning with Leitner algorithm
5. Progress persisted to Supabase database
6. ProgressBar displays statistics and completion
