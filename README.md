# Italian Flashcards

A modern web application for learning Russian-Italian word pairs using spaced repetition and interactive flashcards. Built with React, TypeScript, and Supabase, featuring real-time progress tracking, authentication, and a polished user interface.

## Features

- 🃏 **Interactive Flashcards** - Flip cards to reveal translations
- 📊 **Progress Tracking** - Track learning progress with Leitner spaced repetition
- 🔄 **Multiple Modes** - Study Russian→Italian, Italian→Russian, or mixed
- 🔐 **User Authentication** - Secure login with Supabase Auth
- 🌐 **Real-time Sync** - Progress saved automatically to cloud database
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and Framer Motion animations
- 🌍 **Internationalization** - Multi-language support with i18next

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Testing**: Playwright E2E tests
- **Deployment**: Vercel
- **Database Migrations**: Automated versioning with SHA-256 checksums

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and authentication)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arkuksin/italian-flashcards.git
   cd italian-flashcards
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy `.env.example` to `.env.local` and configure your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

   See [docs/MIGRATION_CREDENTIALS_SETUP.md](docs/MIGRATION_CREDENTIALS_SETUP.md) for detailed setup instructions.

4. **Run database migrations:**
   ```bash
   npm run migrate
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:5173

## Database Migrations

This project uses an automated migration system to manage PostgreSQL schema changes.

### Common Migration Commands

```bash
# Create a new migration
npm run create:migration "add user preferences table"

# Apply pending migrations
npm run migrate

# Check for pending migrations without applying
npm run migrate -- --check

# View SQL content during dry-run
npm run migrate -- --check --verbose

# Lint migrations for common issues
npm run migrate:lint

# Create a rollback migration
npm run migrate:create-revert V20250101120000
```

### Migration Features

- **Automatic Versioning**: Timestamped migration files with SHA-256 checksums
- **Transaction Safety**: All migrations wrapped in transactions with automatic rollback
- **CI/CD Integration**: Validated in GitHub Actions, applied automatically in Vercel builds
- **Linting**: Detect dangerous operations and missing idempotent clauses
- **Rollback Support**: Template-based rollback migration generation

### Learn More

- [Database Versioning Plan](docs/DB_Versioning_Plan.md) - Complete migration workflow guide
- [Migration Rollbacks](docs/db-migration-rollbacks.md) - Recovery procedures and patterns
- [Migration Credentials Setup](docs/MIGRATION_CREDENTIALS_SETUP.md) - GitHub and Vercel configuration

## Testing

### E2E Tests

Run Playwright end-to-end tests:

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Create test user
npm run test:create-user

# Clean up test users
npm run test:cleanup-users
```

### Test Database Safety

⚠️ **Critical**: Always use the test database for development and testing:

- **Test DB**: `slhyzoupwluxgasvapoc.supabase.co`
- **Production DB**: `gjftooyqkmijlvqbkwdr.supabase.co` (never test against this!)

See [docs/dev/TESTING.md](docs/dev/TESTING.md) for comprehensive testing documentation.

## Documentation

Complete project documentation is available in the `/docs` directory:

- **[Documentation Index](docs/INDEX.md)** - Central navigation hub
- **[Architecture](docs/dev/ARCHITECTURE.md)** - Components, state management, data flow
- **[Testing Guide](docs/dev/TESTING.md)** - E2E tests, authentication, email safety
- **[Database Guide](docs/dev/DATABASE.md)** - Schema, queries, maintenance
- **[Deployment Guide](docs/dev/DEPLOYMENT.md)** - Vercel, CI/CD, environments
- **[Code Standards](docs/dev/CODE_STANDARDS.md)** - TypeScript, React conventions

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the code standards in [docs/dev/CODE_STANDARDS.md](docs/dev/CODE_STANDARDS.md)
4. Add tests for new features
5. Update documentation as needed
6. Open a pull request

For migration-related changes, see the [Database Versioning Plan](docs/DB_Versioning_Plan.md).

## Troubleshooting

### Common Issues

**Migrations failing:**
- Check `.env.local` contains correct database credentials
- Verify you're using the test database, not production
- Run `npm run migrate -- --check --verbose` to see SQL content

**Authentication not working:**
- Ensure Supabase URLs and keys are correctly set in `.env.local`
- Check Supabase dashboard for authentication configuration

**Build errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)

See [docs/DB_Versioning_Plan.md#troubleshooting](docs/DB_Versioning_Plan.md#troubleshooting) for migration-specific issues.

## License

This project is maintained by [arkuksin](https://github.com/arkuksin).

## Links

- **Live Application**: https://italian-flashcards-eight.vercel.app
- **GitHub Repository**: https://github.com/arkuksin/italian-flashcards
- **Issue Tracker**: https://github.com/arkuksin/italian-flashcards/issues
# Secrets Migration Verification - Thu Nov  6 21:40:33 CET 2025
