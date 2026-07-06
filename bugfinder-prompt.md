Analyze this Next.js project thoroughly for bugs, errors, security issues, performance problems, and code quality improvements.

Focus on:

1. Server Actions in src/app/lib/ - check for race conditions, error handling, N+1 queries
2. API routes in src/app/api/ - check auth, ownership validation, input validation
3. React components - check for memory leaks, missing dependencies, accessibility
4. Database operations - check transactions, unique constraints, foreign keys
5. Authentication - check session handling, protected routes
6. TypeScript types - check for 'any' types, missing types

Read all files in:

- src/app/lib/ (server actions)
- src/app/api/ (API routes)
- src/components/ (React components)
- prisma/schema.prisma (database schema)

Return a detailed report with:

1. Critical bugs/errors (with file paths and line numbers)
2. Security issues
3. Performance problems
4. Code quality issues
5. Recommendations with code examples when helpful

This is a gaming community app with: nominations, reviews, randomizer/pools, game progress tracking.

IMPORTANT: Generate the report as a markdown file.
