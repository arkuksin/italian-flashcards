# Migration Examples

This directory contains real-world migration examples demonstrating best practices, common patterns, and solutions to typical database schema challenges.

## Example Categories

### Basic Operations
- **[01-add-column.sql](01-add-column.sql)** - Adding columns with defaults and constraints
- **[02-create-table.sql](02-create-table.sql)** - Creating tables with relationships
- **[03-create-index.sql](03-create-index.sql)** - Index creation strategies

### Advanced Patterns
- **[04-data-migration.sql](04-data-migration.sql)** - Safe data transformations with batching
- **[05-zero-downtime-column-rename.sql](05-zero-downtime-column-rename.sql)** - Rename columns without downtime
- **[06-complex-rls-policies.sql](06-complex-rls-policies.sql)** - Row-level security implementation

### Special Cases
- **[07-large-table-migration.sql](07-large-table-migration.sql)** - Handle migrations on tables with millions of rows
- **[08-add-enum-type.sql](08-add-enum-type.sql)** - Working with PostgreSQL enum types
- **[09-multi-step-refactor.sql](09-multi-step-refactor.sql)** - Complex schema refactoring

## Usage

These examples are templates - adapt them to your specific needs:

1. Copy the relevant example
2. Replace table/column names with your own
3. Adjust logic to match your requirements
4. Test on staging database first
5. Run linting: `npm run migrate:lint`
6. Apply with dry-run: `npm run migrate -- --check --verbose`

## Best Practices Demonstrated

- ✅ Idempotent operations (IF EXISTS, IF NOT EXISTS)
- ✅ Proper transaction handling
- ✅ Clear documentation and comments
- ✅ Safe data migrations with batching
- ✅ Index creation with CONCURRENTLY
- ✅ Rollback considerations documented
- ✅ Performance optimization strategies
