# Code Style and Conventions

## TypeScript Configuration
- **Strict mode enabled** - All strict type checking options on
- **ES2020 target** - Modern JavaScript features
- **React JSX** - Uses react-jsx transform
- **No unused variables** - Enforced for locals and parameters
- **No fallthrough cases** - Switch statements must have breaks

## ESLint Rules
- **Base config**: ESLint recommended + TypeScript recommended
- **React Hooks**: Enforces rules of hooks
- **React Refresh**: Warns if non-component exports in component files
- **File patterns**: Lints all `.ts` and `.tsx` files
- **Ignored**: `dist/` directory

## Naming Conventions
Based on observed code patterns:

### Files
- **Components**: PascalCase (e.g., `FlashCard.tsx`, `ModeSelection.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useKeyboard.ts`, `useProgress.ts`)
- **Utilities**: camelCase (e.g., `spacedRepetition.ts`, `emailValidator.ts`)
- **Types**: lowercase (e.g., `index.ts`, `database-types.ts`)
- **Services**: camelCase with Service suffix (e.g., `wordService.ts`)

### Code
- **Interfaces**: PascalCase (e.g., `Word`, `AppState`, `Progress`)
- **Types**: PascalCase (e.g., `LearningDirection`, `DbWord`)
- **Functions/Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE (environment variables)
- **React Components**: PascalCase with default export

## File Organization
```
src/
├── components/          # React components
│   ├── auth/           # Authentication-related components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts (e.g., AuthContext)
├── data/               # Static data (word lists)
├── hooks/              # Custom React hooks
├── lib/                # Library utilities and configurations
├── pages/              # Page components for routing
├── services/           # API and business logic services
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Import Organization
Standard order (observed):
1. External libraries (React, third-party packages)
2. Internal components and hooks
3. Types and interfaces
4. Utilities and helpers
5. Styles (CSS imports)

## React Patterns
- **Functional components** - No class components
- **TypeScript interfaces** for props
- **Custom hooks** for reusable logic
- **Context API** for global state (authentication)
- **Component composition** over inheritance

## Comments and Documentation
- **Minimal inline comments** - Code should be self-documenting
- **JSDoc comments** for complex functions
- **README-style documentation** in dedicated docs/ folder
- **Configuration comments** in config files explaining important settings
