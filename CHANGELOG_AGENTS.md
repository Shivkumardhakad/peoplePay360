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

## 2026-09-05 12:25 IST — Allow required pnpm build scripts

### Summary
- Added an explicit pnpm 11 build-script allowlist for CI dependency installation.

### Files Changed
- `pnpm-workspace.yaml`: Allowed required install scripts for Prisma, NestJS, Tailwind, Sharp, Core JS, and the resolver dependency using pnpm 11's `allowBuilds` setting.
- `CHANGELOG_AGENTS.md`: Recorded the CI build-script approval fix.

### Reason
- pnpm 11 rejected the install because dependency build scripts were not approved, preventing CI from completing dependency installation.

### Validation
- `git diff --check` — passed

### Notes
- The allowlist is limited to packages reported by the failing CI install and avoids enabling arbitrary dependency scripts. pnpm's current build-script policy is documented at https://pnpm.io/cli/approve-builds.
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
## 2026-09-05 12:35 IST — PeoplePay360 Next.js workspace UI

### Summary
- Implemented a polished PeoplePay360 dashboard shell and populated the dashboard and employee directory with representative HR/payroll workflow data.

### Files Changed
- `apps/web/app/(dashboard)/layout.tsx`: Added responsive navigation, workspace header, user profile area, and product branding.
- `apps/web/app/(dashboard)/dashboard/page.tsx`: Added payroll overview, KPI cards, pending actions, and recent payroll activity sections.
- `apps/web/app/(dashboard)/employees/page.tsx`: Added employee metrics, search/filter toolbar, directory table, statuses, and pagination.
- `apps/web/app/globals.css`: Added shared border styling for the refreshed UI.

### Reason
- Turned the Next.js route shell into an actionable frontend representation of the normalized employee, attendance, leave, contract, and payroll architecture described in `temp/one`.

### Validation
- `pnpm --filter web build` — not completed; pnpm terminated with an environment `EPERM` while accessing `C:\Users\DELL`.

### Notes
- The displayed records are static UI fixtures until API wiring is added.
- Existing placeholder routes remain available and were not changed; contracts and payruns now have representative workflow screens.

## 2026-09-05 13:40 IST — Complete normalized schema

### Summary
- Added the complete relational model set described in `temp/one` to the Prisma schema.

### Files Changed
- `packages/db/prisma/schema.prisma`: Added bank accounts, normalized schedule days, contract ownership fields, leave metadata, salary structures/categories/rules, structure-rule joins, payruns, payslips, payslip lines, roles, permissions, and RBAC join tables.
- `CHANGELOG_AGENTS.md`: Recorded the schema change.

### Reason
- The previous schema covered only a subset of HR entities and did not represent the complete employee-to-payslip and role-permission relationships.

### Validation
- `git diff --check` — passed
- Prisma validation — not run; local dependencies are not installed and pnpm is blocked by the environment’s `C:\Users\DELL` access restriction.

### Notes
- Existing legacy HR fields (`baseSalary`, `payrollProfileCode`, `days`, and single `User.role`) remain for backward compatibility.
- Payroll API currently owns its separate Spring database; these Prisma payroll models provide the normalized shared application model requested in `temp/one` and should be reconciled before production migrations.

## 2026-09-05 14:05 IST — Modularize HR API source

### Summary
- Reorganized HR API source into feature-oriented module directories and introduced a dedicated `HrModule` composition boundary.

### Files Changed
- `apps/hr-api/src/modules/*`: Grouped controllers by employees, contracts, attendance, departments, job positions, time off, users, and dashboard.
- `apps/hr-api/src/modules/shared/hr.service.ts`: Moved shared HR application service into the shared module area.
- `apps/hr-api/src/infrastructure/database/prisma.service.ts`: Moved Prisma lifecycle adapter into the infrastructure layer.
- `apps/hr-api/src/modules/hr.module.ts`: Added module-level controller/provider composition.
- `apps/hr-api/src/app.module.ts`: Reduced root module to application composition.
- `CHANGELOG_AGENTS.md`: Recorded the refactor.

### Reason
- Establish a maintainable source architecture while preserving all existing `/api/hr` routes.

### Validation
- `git diff --check` — pending
- NestJS build/tests — not run; dependencies and Maven are unavailable in the local environment.

### Notes
- `HrService` remains a shared application service for now; domain-specific services can be extracted next without changing the route contract.

## 2026-09-05 14:25 IST — Fix Prisma enum syntax for CI

### Summary
- Converted newly added inline Prisma enums to multiline enum definitions supported by Prisma 6.15.

### Files Changed
- `packages/db/prisma/schema.prisma`: Fixed enum declarations for employment, record, schedule, salary rule, payrun, and payslip statuses.
- `CHANGELOG_AGENTS.md`: Recorded the CI fix.

### Reason
- CI failed during `prisma generate` with P1012 because Prisma requires one enum value per line.

### Validation
- `git diff --check` — pending
- Prisma generate — not run locally; dependency installation is unavailable in the local environment.

### Notes
- Turborepo telemetry and Prisma package.json deprecation messages are warnings and were not the failure cause.

## 2026-09-05 14:45 IST — Fix bank account relation validation

### Summary
- Marked the employee bank-account foreign key as unique for the intended one-to-one relationship.

### Files Changed
- `packages/db/prisma/schema.prisma`: Added `@unique` to `Employee.bankAccountId`.
- `CHANGELOG_AGENTS.md`: Recorded the CI fix.

### Reason
- CI failed during Prisma DMMF generation with P1012 because one-to-one defining relation fields must be unique.

### Validation
- `git diff --check` — pending
- Prisma generate — not run locally; CI is the available validation environment.

### Notes
- Turborepo telemetry and output warnings remain non-blocking.

## 2026-09-05 15:05 IST — Standardize databases on PostgreSQL

### Summary
- Switched the Prisma HR database and Spring payroll database configuration from MySQL to PostgreSQL.

### Files Changed
- `packages/db/prisma/schema.prisma`: Changed datasource provider to `postgresql`.
- `apps/payroll-api/pom.xml`: Replaced MySQL Flyway/database dependencies with PostgreSQL equivalents.
- `apps/payroll-api/src/main/resources/application.yml`: Updated default JDBC URL and username.
- `apps/payroll-api/src/main/resources/db/migration/V1__payroll_schema.sql`: Removed MySQL-only timestamp update clauses.
- `README.md`: Updated local setup documentation.
- `CHANGELOG_AGENTS.md`: Recorded the database switch.

### Reason
- PostgreSQL matches the company’s database standard and gives the hackathon a consistent database story across both services.

### Validation
- `git diff --check` — pending
- Prisma generate — not run locally; dependencies are unavailable.
- Maven tests — not run locally; Maven is unavailable.

### Notes
- Existing MySQL databases are not migrated automatically. A fresh PostgreSQL database and new Prisma/Flyway migrations are required.

## 2026-09-05 15:25 IST — Modernize TypeScript module resolution

### Summary
- Updated the HR API TypeScript configuration to use the modern Node16 module and module-resolution pair.

### Files Changed
- `apps/hr-api/tsconfig.json`: Replaced deprecated `CommonJS`/`Node` resolution settings with `node16`/`node16`.
- `CHANGELOG_AGENTS.md`: Recorded the TypeScript configuration fix.

### Reason
- CI/editor TypeScript reported that the legacy `node10` resolution strategy is deprecated.

### Validation
- `git diff --check` — pending
- TypeScript build — not run locally; dependencies are unavailable.

### Notes
- The Node16 pair keeps Node-aware resolution while preserving CommonJS behavior for this NestJS package because it does not declare ESM in its package metadata.

## 2026-09-05 15:45 IST — Fix dashboard icon typing

### Summary
- Added an explicit Lucide icon type to the dashboard pending-actions fixture.

### Files Changed
- `apps/web/app/(dashboard)/dashboard/page.tsx`: Typed pending action icon components as `LucideIcon` so Next.js TypeScript checks accept JSX rendering.
- `CHANGELOG_AGENTS.md`: Recorded the build fix.

### Reason
- CI `web:build` failed because an untyped mixed tuple inferred `Icon` without a callable JSX component signature.

### Validation
- `git diff --check` — pending
- `pnpm build` — not run locally; dependencies are unavailable.

### Notes
- This is a compile-time typing fix only; displayed dashboard data remains static fixture data.
