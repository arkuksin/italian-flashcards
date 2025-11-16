# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Italian flashcards application for learning Russian-Italian word pairs. Built with React 18, TypeScript, Tailwind CSS, Supabase backend, and deployed on Vercel.

**📚 Full Documentation**: [docs/INDEX.md](docs/INDEX.md)

## Quick Commands

### Development
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Check code quality

### Testing
- `npm run test:e2e` - Run E2E tests
- `npm run test:e2e:ui` - Interactive test UI
- `npm run test:create-user` - Create safe test user
- `npm run test:cleanup-users` - Clean test database

### Database Migrations
- `npm run create:migration "description"` - Create new migration file
- `npm run migrate` - Apply pending migrations
- `npm run migrate -- --check` - Validate migrations without applying
- `npm run bootstrap:migrations` - Track existing migrations

### Database & Security
- `npm run setup:branch-protection` - Configure GitHub branch protection
- `npm run prod:list-users` - Audit production users (read-only)
- `npm run health:check` - Monitor email health

**Details**: [docs/dev/TESTING.md](docs/dev/TESTING.md), [docs/dev/DATABASE.md](docs/dev/DATABASE.md), [docs/DB_Versioning_Plan.md](docs/DB_Versioning_Plan.md)

## Specialized Agents

Delegate to specialized agents for focused workflows:

- **test-runner** - E2E test execution and debugging
- **e2e-test-generator** - Create new test coverage
- **git-github-manager** - Complex Git workflows, PRs, commits
- **database-cleanup-guardian** - User/data cleanup and maintenance
- **security-auditor** - Security checks before production deploys
- **deployment-verifier** - Verify deployments and production health
- **markdown-beautifier** - Format documentation beautifully

**See**: `.claude/agents/` for detailed agent documentation

## Skills

Reusable patterns and guidelines available via skills:

- **react-component-generator** - Create React components following project patterns
- **database-migration-creator** - Supabase schema changes and migrations
- **git-commit-formatter** - Conventional commit messages
- **supabase-query-helper** - Type-safe database queries
- **test-case-writer** - Playwright E2E test creation

**See**: `.claude/skills/` for skill details

## Documentation

All detailed information organized in `/docs`:

- **[Documentation Index](docs/INDEX.md)** - Central navigation hub
- **[Architecture](docs/dev/ARCHITECTURE.md)** - Components, state, hooks, data flow
- **[Testing](docs/dev/TESTING.md)** - E2E tests, authentication testing, email safety
- **[Database](docs/dev/DATABASE.md)** - Supabase schema, queries, maintenance
- **[Deployment](docs/dev/DEPLOYMENT.md)** - Vercel, CI/CD, environments
- **[Authentication](docs/dev/AUTHENTICATION.md)** - OAuth flows, user management
- **[Code Standards](docs/dev/CODE_STANDARDS.md)** - TypeScript, React, styling conventions

## ⚠️ Critical Safety Rules

### Email Bounce Prevention (TOP PRIORITY)
- **NEVER** use fake/throwaway emails (@test.com, @mailinator.com, etc.)
- **ALWAYS** use test database for development (`slhyzoupwluxgasvapoc`)
- **ALWAYS** create test users with `npm run test:create-user`
- High bounce rates **restrict** Supabase email sending

### Database Safety
- **Test DB**: `slhyzoupwluxgasvapoc.supabase.co` (safe for testing)
- **Production DB**: `gjftooyqkmijlvqbkwdr.supabase.co` (NEVER test against this)
- Local `.env.local` already points to test database

**Details**: [docs/dev/DATABASE.md](docs/dev/DATABASE.md), [docs/TESTING_BEST_PRACTICES.md](docs/TESTING_BEST_PRACTICES.md)

## Communication Style

Always communicate in simple, clear English:
- Use short, straightforward sentences
- Explain technical terms when necessary
- Avoid complex vocabulary
- Keep explanations concise and easy to understand

---

**Need Help?** Check [docs/INDEX.md](docs/INDEX.md) for complete documentation navigation.
