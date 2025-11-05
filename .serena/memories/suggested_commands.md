# Suggested Commands

## Development
```bash
npm run dev              # Start development server on http://localhost:5173
npm run dev:test         # Start dev server with test environment variables
npm run build            # Build for production
npm run preview          # Preview production build locally
```

## Code Quality
```bash
npm run lint             # Run ESLint on all TypeScript files
```

## Testing

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run tests with Playwright UI
npm run test:e2e:headed  # Run tests in headed mode (visible browser)
npm run setup:e2e        # Setup E2E test environment
```

## User Management & Testing

### Test Database Operations
```bash
npm run test:create-user           # Create test user in test database
npm run test:cleanup-users         # Clean test database (dry-run by default)
```

### Production Database Operations
```bash
npm run prod:list-users            # List all production users
npm run prod:delete-users          # Delete invalid users (with confirmation)
npm run prod:delete-users:dry-run  # Preview what would be deleted
npm run prod:cleanup-users         # Preview production cleanup (dry-run)
```

### Email Health Monitoring
```bash
npm run health:check               # Monitor email bounce rates and health
```

## GitHub & Branch Protection
```bash
npm run setup:branch-protection    # Configure GitHub branch protection rules
npm run verify:branch-protection   # Verify branch protection is configured correctly
```

## Platform-Specific Development Servers
```bash
./start-linux.sh         # Start dev server on Linux
./start-windows.ps1      # Start dev server on Windows (PowerShell)
```

## Common Development Workflow
1. Start dev server: `npm run dev`
2. Make code changes
3. Run linter: `npm run lint`
4. Run E2E tests: `npm run test:e2e`
5. Build for production: `npm run build`
6. Preview build: `npm run preview`

## Important Notes
- **Test database is default**: `.env.local` points to test database by default for safety
- **Never use fake emails**: High bounce rates can suspend Supabase email service
- **Always run tests before pushing**: E2E tests should pass
- **Clean up test users**: Regularly run cleanup scripts to maintain database hygiene
