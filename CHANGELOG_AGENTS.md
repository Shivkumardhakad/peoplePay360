## 2026-09-05 11:58 IST — CI workflow

### Summary
- Added a GitHub Actions CI workflow that runs for every pushed commit and pull request.

### Files Changed
- `.github/workflows/ci.yml`: Added repository validation and conditional Node.js install, test, and build steps.
- `CHANGELOG_AGENTS.md`: Recorded this change.

### Reason
- Provide automated checks for each commit while keeping the workflow usable before application source files and package metadata are added.

### Validation
- `git diff --check` — passed
- `git status --short` — reviewed

### Notes
- The current repository has no `package.json`, so Node.js checks will be skipped until one is added.

## 2026-09-05 12:15 IST — Fix pnpm CI runtime

### Summary
- Updated CI for the pnpm monorepo and current Node.js runner runtime.

### Files Changed
- `.github/workflows/ci.yml`: Switched from Node 20/npm to Node 24/pnpm and removed npm lockfile caching.
- `CHANGELOG_AGENTS.md`: Recorded the CI fix.

### Reason
- CI failed because it requested deprecated Node 20 and attempted npm dependency caching without a `package-lock.json`.

### Validation
- `git diff --check` — passed
- `git status --short` — reviewed

### Notes
- CI uses `pnpm install --no-frozen-lockfile` because the repository does not currently contain a `pnpm-lock.yaml`.
## 2026-09-05 11:20 +05:30 — Codex Project Scaffold

### Summary
- Scaffolded the PeoplePay360 pnpm/Turborepo monorepo with database, validation, payroll engine, UI, config, and Next.js web app packages.
- Added Prisma HR/payroll schema, seed data, NextAuth credentials wiring, base dashboard routes, and focused payroll-engine tests.

### Files Changed
- `package.json`: Added root workspace scripts and Turborepo dependency.
- `pnpm-workspace.yaml`: Added workspace package globs.
- `turbo.json`: Added monorepo task pipeline.
- `packages/config/tsconfig.base.json`: Added shared TypeScript compiler options.
- `packages/config/eslint-preset.js`: Added shared lint preset.
- `packages/db/package.json`: Added Prisma package configuration and seed command using the `@peoplepay360/db` workspace name.
- `packages/db/tsconfig.json`: Added TypeScript config for database package.
- `packages/db/src/client.ts`: Added PrismaClient singleton export.
- `packages/db/prisma/schema.prisma`: Added core PeoplePay360 data model.
- `packages/db/prisma/seed.ts`: Added sample salary structure, rules, schedules, employees, contracts, time-off data, attendance, and admin user.
- `packages/validation/package.json`: Added validation package setup.
- `packages/validation/tsconfig.json`: Added TypeScript config.
- `packages/validation/src/*.ts`: Added Zod schemas for employees, contracts, salary rules, payruns, and time off.
- `packages/payroll-engine/package.json`: Added pure payroll engine package setup.
- `packages/payroll-engine/tsconfig.json`: Added TypeScript config.
- `packages/payroll-engine/src/*.ts`: Added contract resolution, payslip computation, exports, and unit tests.
- `packages/ui/package.json`: Added minimal placeholder package for future shared UI.
- `apps/web/package.json`: Added Next.js app dependencies and scripts.
- `apps/web/tsconfig.json`: Added Next.js TypeScript config.
- `apps/web/next-env.d.ts`: Added Next type references.
- `apps/web/next.config.ts`: Added workspace package transpilation.
- `apps/web/postcss.config.mjs`: Added Tailwind v4 PostCSS config.
- `apps/web/components.json`: Added shadcn-style configuration.
- `apps/web/app/**/*.tsx`: Added app layout, NextAuth-backed login page, dashboard shell, and requested route placeholders.
- `apps/web/app/globals.css`: Added base Tailwind and theme CSS.
- `apps/web/lib/*.ts`: Added utilities and NextAuth options.
- `apps/web/types/next-auth.d.ts`: Added NextAuth session/JWT type augmentation.
- `apps/web/components/ui/*.tsx`: Added minimal Button, Table, and Form components.
- `apps/web/middleware.ts`: Added auth guard and employee payroll route restriction.

### Reason
- The project requirements asked for an initial PeoplePay360 monorepo setup that establishes the data spine, validation layer, isolated payroll logic, Next.js route shape, seeded sample data, and authentication boundaries before feature work begins.

### Validation
- `pnpm install` — not run yet.
- `pnpm --filter @peoplepay360/payroll-engine test` — not run yet.
- `pnpm build` — not run yet.
- `pnpm db:migrate` — not run because a MySQL `DATABASE_URL` was not provided.
- `pnpm db:seed` — not run because migration/database setup was not completed.

### Notes
- The Prisma schema is based on the provided setup brief and repository domain rules because the referenced `PeoplePay360_Technical_Requirements.md` was not present in the workspace.
- `.env` remains uncommitted per repository security rules; create it locally with a MySQL `DATABASE_URL` before running migrations.

## 2026-09-05 11:41 +05:30 — Codex Node/Spring Ownership Split

### Summary
- Reworked the scaffold so Node/NestJS owns HR resources and Java/Spring Boot owns payroll resources.
- Added a NestJS HR API skeleton, moved payroll engine concepts out of the JS package layer, and added a Spring Boot payroll API skeleton with payroll calculation tests and Flyway migration.

### Files Changed
- `package.json`: Added HR API and payroll API scripts and removed the JS payroll-engine workspace dependency path from the active app graph.
- `README.md`: Documented the Node HR API and Spring payroll API ownership boundary.
- `apps/hr-api`: Added NestJS app module, controllers, Prisma service, and HR read service using lightweight `ts-node`/`tsc` scripts.
- `apps/payroll-api`: Added Spring Boot Maven project, payroll domain enums/entities, payroll engine endpoint, auditor placeholder endpoint, configuration, migration, and unit test.
- `apps/web/package.json`: Removed `@peoplepay360/payroll-engine` from frontend dependencies and pinned JS dependency versions to reduce install drift.
- `apps/web/next.config.ts`: Removed payroll-engine transpilation.
- `packages/db/prisma/schema.prisma`: Removed payroll-owned models and added HR-owned departments, job positions, and `payrollProfileCode` on contracts.
- `packages/db/prisma/seed.ts`: Updated seed data for HR departments/job positions and idempotent contract creation.
- `packages/validation/src`: Removed payroll-owned validation schemas and added HR-owned department, job position, and attendance schemas.
- `packages/payroll-engine`: Deleted the JS payroll engine package because payroll logic now belongs to Spring Boot.

### Reason
- The requested architecture assigns HR responsibilities to the Node/NestJS API and payroll responsibilities to the Java/Spring Boot service, so the initial monorepo scaffold needed to reflect that service boundary before setup could be considered complete.

### Validation
- `pnpm install --fetch-timeout 600000` — failed/stopped; npm registry downloads repeatedly stalled and no `pnpm-lock.yaml` or `node_modules` were created.
- `pnpm --filter @peoplepay360/hr-api build` — not run because dependencies were not installed.
- `pnpm --filter web build` — not run because dependencies were not installed.
- `mvn -q -f apps/payroll-api/pom.xml test` — started but stopped after it produced no output within the quick validation window, likely while resolving dependencies.
- `pnpm db:migrate` — not run because a MySQL `DATABASE_URL` was not provided.
- `pnpm db:seed` — not run because migration/database setup was not completed.

### Notes
- Payroll and HR database ownership are separated at the code level. Cross-service links use stable identifiers such as `employeeId`, `contractId`, and `payrollProfileCode` rather than ORM relations across services.
