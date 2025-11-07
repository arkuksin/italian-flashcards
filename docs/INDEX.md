# Documentation Index

Welcome to the Italian Flashcards project documentation. This index helps you quickly find the information you need.

## Quick Links by Category

### 🚀 Getting Started
- **[Main Project Guide](../CLAUDE.md)** - Quick commands, project overview, communication style
- **[Technical Architecture](./dev/ARCHITECTURE.md)** - Components, state management, data flow
- **[Code Standards](./dev/CODE_STANDARDS.md)** - TypeScript patterns, React conventions, styling

### 🧪 Testing & Quality
- **[Testing Guide](./dev/TESTING.md)** - Comprehensive testing documentation
- **[E2E Authentication Testing](./E2E_AUTHENTICATION_TESTING.md)** - Real Supabase auth testing
- **[Testing Best Practices](./TESTING_BEST_PRACTICES.md)** - Email safety, test user management
- **[E2E Testing Guide](./e2e-testing.md)** - Playwright setup and usage

### 🗄️ Database & Backend
- **[Database Guide](./dev/DATABASE.md)** - Supabase, dual databases, email safety
- **[Supabase Setup](./SUPABASE_SETUP.md)** - Initial Supabase configuration
- **[Supabase API Keys](./SUPABASE_API_KEYS.md)** - API key management
- **[Test Database Setup](./TEST_DATABASE_SETUP.md)** - Test environment configuration
- **[Manual Schema Setup](./MANUAL_SCHEMA_SETUP.md)** - Database schema details
- **[Cleanup Procedures](./CLEANUP_PROCEDURES.md)** - Database maintenance and user cleanup
- **[DB Versioning Plan](./DB_Versioning_Plan.md)** - Complete migration system guide
- **[Migration Credentials Setup](./MIGRATION_CREDENTIALS_SETUP.md)** - GitHub Secrets and Vercel configuration
- **[Migration Rollbacks](./db-migration-rollbacks.md)** - Recovery steps and rollback patterns

### 🔐 Authentication & Security
- **[Authentication Guide](./dev/AUTHENTICATION.md)** - OAuth flows, user management
- **[Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)** - Google OAuth integration

### 🚢 Deployment & CI/CD
- **[Deployment Guide](./dev/DEPLOYMENT.md)** - Vercel, CI/CD, environments
- **[Vercel Environment Setup](./VERCEL_ENVIRONMENT_SETUP.md)** - Environment variables
- **[Vercel MCP Setup](./VERCEL_MCP_SETUP.md)** - MCP server integration

### 📋 Process & Workflow
- **[Claude Code Improvements](./CLAUDE_CODE_IMPROVEMENTS.md)** - Implementation plan for best practices
- **[Dev Docs Workflow](./dev/WORKFLOW.md)** - Large task management system
- **[Business Requirements](./Fachliches_Dokument.md)** - German business documentation

### 🤖 Claude Code Infrastructure
- **[Agents](../.claude/agents/)** - 7 specialized agents for different workflows
- **[Skills](../.claude/skills/)** - 5 reusable skills for common tasks
- **[Commands](../.claude/commands/)** - Custom slash commands

## Decision Tree: Find What You Need

### "I want to..."

#### Set Up the Project
- **First time setup** → [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Configure test database** → [TEST_DATABASE_SETUP.md](./TEST_DATABASE_SETUP.md)
- **Set up Google OAuth** → [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- **Configure Vercel deployment** → [VERCEL_ENVIRONMENT_SETUP.md](./VERCEL_ENVIRONMENT_SETUP.md)

#### Understand the Codebase
- **High-level architecture** → [dev/ARCHITECTURE.md](./dev/ARCHITECTURE.md)
- **Component structure** → [dev/ARCHITECTURE.md](./dev/ARCHITECTURE.md)
- **State management** → [dev/ARCHITECTURE.md](./dev/ARCHITECTURE.md)
- **Code conventions** → [dev/CODE_STANDARDS.md](./dev/CODE_STANDARDS.md)

#### Work with Testing
- **Run E2E tests** → [dev/TESTING.md](./dev/TESTING.md)
- **Test with authentication** → [E2E_AUTHENTICATION_TESTING.md](./E2E_AUTHENTICATION_TESTING.md)
- **Create test users** → [TESTING_BEST_PRACTICES.md](./TESTING_BEST_PRACTICES.md)
- **Debug test failures** → [dev/TESTING.md](./dev/TESTING.md)

#### Manage Database
- **Create/update schema** → [MANUAL_SCHEMA_SETUP.md](./MANUAL_SCHEMA_SETUP.md)
- **Clean up test users** → [CLEANUP_PROCEDURES.md](./CLEANUP_PROCEDURES.md)
- **Understand email safety** → [dev/DATABASE.md](./dev/DATABASE.md)
- **Query patterns** → [dev/DATABASE.md](./dev/DATABASE.md)

#### Handle Authentication
- **OAuth flow overview** → [dev/AUTHENTICATION.md](./dev/AUTHENTICATION.md)
- **Google OAuth setup** → [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- **User management** → [dev/AUTHENTICATION.md](./dev/AUTHENTICATION.md)
- **Security best practices** → [dev/AUTHENTICATION.md](./dev/AUTHENTICATION.md)

#### Deploy the Application
- **Vercel deployment** → [dev/DEPLOYMENT.md](./dev/DEPLOYMENT.md)
- **Environment variables** → [VERCEL_ENVIRONMENT_SETUP.md](./VERCEL_ENVIRONMENT_SETUP.md)
- **CI/CD workflows** → [dev/DEPLOYMENT.md](./dev/DEPLOYMENT.md)
- **MCP integration** → [VERCEL_MCP_SETUP.md](./VERCEL_MCP_SETUP.md)

#### Use Claude Code Features
- **Use specialized agents** → [../CLAUDE.md](../CLAUDE.md)
- **Create components** → `.claude/skills/react-component-generator/`
- **Write tests** → `.claude/skills/test-case-writer/`
- **Manage git workflows** → `.claude/commands/push.md`
- **Improve workflow** → [CLAUDE_CODE_IMPROVEMENTS.md](./CLAUDE_CODE_IMPROVEMENTS.md)

## Documentation Organization

### Core Documentation (`/docs`)
Primary documentation files covering setup, testing, and maintenance procedures.

### Development Guides (`/docs/dev`)
Technical documentation for developers working on the codebase:
- Architecture and component patterns
- Testing strategies and frameworks
- Database management and queries
- Deployment and CI/CD processes
- Authentication and security
- Code standards and conventions
- Development workflows

### Claude Code Configuration (`/.claude`)
Infrastructure for AI-assisted development:
- **agents/** - Specialized agents for automated workflows
- **skills/** - Reusable patterns and guidelines
- **commands/** - Custom slash commands
- **settings.local.json** - Permissions and MCP configuration

### Utility Scripts (`/scripts`)
22 automation scripts for database management, testing, deployment, and maintenance.

## Quick Reference: Common Tasks

| Task | Command | Documentation |
|------|---------|---------------|
| Start dev server | `npm run dev` | [CLAUDE.md](../CLAUDE.md) |
| Run E2E tests | `npm run test:e2e` | [dev/TESTING.md](./dev/TESTING.md) |
| Create test user | `npm run test:create-user` | [TESTING_BEST_PRACTICES.md](./TESTING_BEST_PRACTICES.md) |
| Clean test database | `npm run test:cleanup-users` | [CLEANUP_PROCEDURES.md](./CLEANUP_PROCEDURES.md) |
| Build for production | `npm run build` | [CLAUDE.md](../CLAUDE.md) |
| Run linter | `npm run lint` | [dev/CODE_STANDARDS.md](./dev/CODE_STANDARDS.md) |
| Setup branch protection | `npm run setup:branch-protection` | [CLAUDE.md](../CLAUDE.md) |
| Check deployment | Use `deployment-verifier` agent | [dev/DEPLOYMENT.md](./dev/DEPLOYMENT.md) |

## Documentation Status

### ✅ Complete
- Setup and configuration guides
- Testing documentation
- Database and authentication guides
- Deployment and CI/CD docs
- Claude Code improvement plan

### 🚧 In Progress
- `dev/ARCHITECTURE.md` - Technical architecture guide
- `dev/TESTING.md` - Consolidated testing documentation
- `dev/DATABASE.md` - Database management guide
- `dev/DEPLOYMENT.md` - Deployment and CI/CD guide
- `dev/AUTHENTICATION.md` - Authentication and security guide
- `dev/CODE_STANDARDS.md` - Code standards and conventions
- `dev/WORKFLOW.md` - Dev docs workflow for large tasks

## Contributing to Documentation

When adding new documentation:
1. Place setup/configuration docs in `/docs`
2. Place technical guides in `/docs/dev`
3. Update this INDEX.md with links
4. Keep [CLAUDE.md](../CLAUDE.md) under 75 lines (link to detailed docs)
5. Follow the established format and structure

## Getting Help

- **Quick questions**: Check [CLAUDE.md](../CLAUDE.md) first
- **Technical details**: Browse `/docs/dev` guides
- **Setup issues**: Check relevant setup guide above
- **Claude Code usage**: See [CLAUDE_CODE_IMPROVEMENTS.md](./CLAUDE_CODE_IMPROVEMENTS.md)
- **Custom workflows**: Check `.claude/agents/` and `.claude/commands/`

---

**Last Updated**: 2025-11-01
**Maintained By**: Project team with Claude Code assistance
