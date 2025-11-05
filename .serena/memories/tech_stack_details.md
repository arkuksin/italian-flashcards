# Technical Stack Details

## Core Technologies

### Build & Development
- **Vite 7.1.7** - Fast development server and optimized builds
- **TypeScript 5.5.3** - Type safety with strict mode enabled
- **Node.js** - Runtime environment (ES modules)

### UI Framework & Libraries
- **React 18.3.1** - Component-based UI library
- **React DOM 18.3.1** - React renderer for web
- **React Router DOM 7.9.2** - Client-side routing and navigation
- **Framer Motion 12.23.12** - Animation library for smooth transitions
- **Lucide React 0.344.0** - Icon library (excluded from Vite optimizeDeps)

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.4.35** - CSS processing tool
- **Autoprefixer 10.4.18** - Automatic vendor prefix addition

### Backend Services
- **Supabase JS 2.57.4** - Client library for Supabase backend
- **Supabase Auth UI React 0.4.7** - Pre-built authentication UI components
- **Supabase Auth UI Shared 0.1.8** - Shared authentication utilities

### Utilities
- **date-fns 4.1.0** - Date manipulation and formatting

### Development Tools
- **ESLint 9.9.1** - JavaScript/TypeScript linting
  - @eslint/js
  - typescript-eslint
  - eslint-plugin-react-hooks
  - eslint-plugin-react-refresh
- **Playwright 1.47.0** - E2E testing framework
- **dotenv 17.2.2** - Environment variable management

## TypeScript Configuration
- **Target**: ES2020
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx (new JSX transform)
- **Strict mode**: Enabled
- **Additional checks**: noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch
- Separate configs for app (src/) and node (config files)
