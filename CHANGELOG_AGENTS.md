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

## 2026-09-05 18:10 IST — Add HR CRUD workflow endpoints

### Summary
- Added employee, department, job-position, contract, attendance, and time-off create/update/detail/decision endpoints.

### Files Changed
- `apps/hr-api/src/modules/shared/hr.service.ts`: Added database operations and transactional leave approval balance consumption.
- `apps/hr-api/src/modules/*/*.controller.ts`: Added CRUD and workflow routes while preserving existing list routes.
- `apps/hr-api/package.json`: Declared the Prisma client as a direct HR API dependency.
- `CHANGELOG_AGENTS.md`: Recorded the API work.

### Reason
- The API layer previously exposed only read-only list endpoints.

### Validation
- `pnpm --filter @peoplepay360/hr-api build` — initially failed because `@prisma/client` was not declared directly; dependency fix pending verification.

### Notes
- Request DTOs currently use Prisma input types; shared Zod validation and authorization guards should be added before production exposure.

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

## 2026-09-05 16:25 IST — Fix employee directory color typing

### Summary
- Made the employee fixture a readonly tuple so its avatar color key remains a valid indexed literal under strict TypeScript checks.

### Files Changed
- `apps/web/app/(dashboard)/employees/page.tsx`: Added literal tuple typing for employee fixture rows and a typed avatar color map.
- `CHANGELOG_AGENTS.md`: Recorded the build fix.

### Reason
- CI `web:build` failed because array destructuring widened the avatar color value to possibly undefined.

### Validation
- `git diff --check` — pending
- `pnpm build` — not run locally; dependencies are unavailable.

### Notes
- Dashboard data remains static fixture data.
## 2026-09-05 14:35 IST — Payroll database initialization

### Summary
- Added Spring Data JPA entities for the payroll models defined in the Prisma schema.
- Enabled Hibernate schema initialization against PostgreSQL for the Java payroll service.

### Files Changed
- `apps/payroll/src/main/java/com/dj/payroll/domain/SalaryStructure.java`: Added salary structure persistence model.
- `apps/payroll/src/main/java/com/dj/payroll/domain/SalaryRuleCategory.java`: Added salary rule category persistence model.
- `apps/payroll/src/main/java/com/dj/payroll/domain/SalaryRule.java`: Added salary rule persistence model.
- `apps/payroll/src/main/java/com/dj/payroll/domain/SalaryStructureRule.java`: Added structure-to-rule persistence model.
- `apps/payroll/src/main/java/com/dj/payroll/domain/Payrun.java`: Added payrun persistence model.
- `apps/payroll/src/main/java/com/dj/payroll/domain/Payslip.java`: Added payslip persistence model.
- `apps/payroll/src/main/resources/application.yaml`: Enabled globally quoted Hibernate identifiers to preserve Prisma table and column names.

### Reason
- The Java payroll app had no persistence models, so Spring Boot could not initialize the payroll tables represented by `schema.prisma`.

### Validation
- `mvn -f apps/payroll/pom.xml test` — failed because the active shell used Java 8 while Spring Boot 4.1.1 requires Java 17+.
- `JAVA_HOME="C:\\Program Files\\Java\\jdk-21.0.10" mvn -f apps/payroll/pom.xml test` — passed; Spring Boot connected to PostgreSQL and Hibernate created the payroll tables.

### Notes
- Hibernate `ddl-auto: update` initializes or updates the payroll tables at application startup. Existing data is preserved by this setting.

## 2026-09-05 14:45 IST — Add PayslipLine entity

### Summary
- Added the missing Java JPA entity for the Prisma `PayslipLine` model.

### Files Changed
- `apps/payroll/src/main/java/com/dj/payroll/entities/PayslipLine.java`: Added payslip line fields and decimal precision matching `schema.prisma`.

### Reason
- `PayslipLine` is part of the payroll schema and was missing from the Java persistence models.

### Validation
- `JAVA_HOME="C:\\Program Files\\Java\\jdk-21.0.10" mvn -f apps/payroll/pom.xml test` — run after implementation.

### Notes
- The entity follows the existing Java package name `com.dj.payroll.entities`.

## 2026-09-05 15:00 IST — JWT authorization for payroll API

### Summary
- Added bearer JWT validation and role-based authorization to the Java payroll service.

### Files Changed
- `apps/payroll/pom.xml`: Added Spring Security OAuth2 resource-server and JOSE dependencies.
- `apps/payroll/src/main/resources/application.yaml`: Added `JWT_SECRET` configuration.
- `apps/payroll/src/main/java/com/dj/payroll/security/SecurityConfig.java`: Validated JWTs and mapped the `role` claim to Spring authorities.

### Reason
- Payroll endpoints must validate the incoming JWT and allow access only to `ADMIN`, `PAYROLL_MANAGER`, or `HR_MANAGER` users.

### Validation
- `JAVA_HOME="C:\\Program Files\\Java\\jdk-21.0.10" JWT_SECRET="<32+ characters>" mvn -f apps/payroll/pom.xml test` — passed; 1 test succeeded after fixing the claim converter generic type.

### Notes
- The application requires `JWT_SECRET` to be at least 32 characters and expects a signed bearer JWT in the `Authorization` header.

## 2026-09-05 15:05 IST — Align JWT application configuration

### Summary
- Moved the JWT secret configuration under Spring Boot's standard resource-server property path.

### Files Changed
- `apps/payroll/src/main/resources/application.yaml`: Configured `spring.security.oauth2.resourceserver.jwt.secret-key` from `JWT_SECRET`.
- `apps/payroll/src/main/java/com/dj/payroll/security/SecurityConfig.java`: Read the standard Spring property for JWT validation.

### Reason
- Keep Maven dependencies in `pom.xml` and JWT runtime configuration in `application.yaml` using the standard Spring Security property structure.

### Validation
- `mvn -f apps/payroll/pom.xml clean compile -DskipTests` — run after configuration update.

### Notes
- `JWT_SECRET` must contain at least 32 characters when the application starts.

## 2026-09-05 15:10 IST — Fix SecurityConfig import

### Summary
- Corrected the `HttpSecurity` import typo in the JWT security configuration.

### Files Changed
- `apps/payroll/src/main/java/com/dj/payroll/security/SecurityConfig.java`: Changed `builde` to `builders` in the Spring Security import.

### Reason
- Maven could not resolve `HttpSecurity` because the package name was misspelled.

### Validation
- `mvn -U -f apps/payroll/pom.xml clean compile -DskipTests` — run after the import fix.

### Notes
- No authorization behavior was changed; this was a compile-fix only.

## 2026-09-05 15:20 IST — Standardize Java 21 Maven project

### Summary
- Added a root Maven project that includes the payroll service as a Java 21 module.
- Declared Java 21 compiler and UTF-8 settings at both root and payroll module levels.

### Files Changed
- `pom.xml`: Added the Java 21 Maven aggregator for the repository's Java services.
- `apps/payroll/pom.xml`: Explicitly configured Java 21 compiler release and UTF-8 source encoding.

### Reason
- IntelliJ was opening the repository as a plain Java module, so Maven dependencies were not available to `SecurityConfig.java`.
- A root Maven project gives the IDE a clear Maven entry point and keeps the payroll service compatible with Java 21.

### Validation
- `mvn -f pom.xml -pl apps/payroll -am clean compile -DskipTests` — run after the Maven project update.

### Notes
- Open or reload the repository root `pom.xml` as a Maven project in IntelliJ.

## 2026-09-05 15:30 IST — Complete Java 21 Spring dependencies

### Summary
- Added the direct Spring Security modules used by `SecurityConfig` and the validation starter to the payroll module.

### Files Changed
- `apps/payroll/pom.xml`: Added Spring Security config/core/web, OAuth2 JWT modules, and Spring Boot validation dependency under the Spring Boot 4.1.1 dependency management.

### Reason
- Make every package directly used by the Java 21 payroll application explicit in Maven so IDE and command-line builds resolve the same compatible dependencies.

### Validation
- `mvn -f pom.xml -pl apps/payroll -am clean compile -DskipTests` — run after dependency update.
- `mvn -f pom.xml -pl apps/payroll -am test` — run after dependency update.

### Notes
- Dependency versions remain managed by the Spring Boot 4.1.1 parent; no individual Spring Security versions were hardcoded.

## 2026-09-05 15:40 IST — Centralize Java dependencies in root Maven POM

### Summary
- Converted the root Maven project into the Spring Boot parent project.
- Moved all shared payroll dependencies into the root `pom.xml`.
- Changed the payroll module to inherit dependencies from the root project.

### Files Changed
- `pom.xml`: Added Spring Boot 4.1.1 parent and all Java 21 payroll dependencies.
- `apps/payroll/pom.xml`: Changed parent to the root Maven project and removed duplicated dependency declarations.

### Reason
- Dependencies were previously visible only in the module POM, while the root POM appeared empty to IntelliJ.
- Centralizing them makes the root project the single Maven entry point.

### Validation
- `mvn -f pom.xml -pl apps/payroll -am test` — run after centralizing dependencies.

### Notes
- Java source and target remain Java 21, and Spring dependency versions continue to come from Spring Boot 4.1.1.

## 2026-09-05 15:40 IST — Verify payroll runtime startup

### Summary
- Started the payroll Spring Boot application with Java 21, JWT configuration, and PostgreSQL enabled.

### Files Changed
- No repository files changed; runtime verification only.

### Reason
- Confirm the application works beyond compilation and tests.

### Validation
- `mvn -f apps/payroll/pom.xml spring-boot:run` — passed; application started on port 8080 with Java 21.0.10 and connected to PostgreSQL.
- `curl.exe http://localhost:8080/` — returned HTTP 401, confirming security protection is active.

### Notes
- The test process was stopped gracefully after the startup and authorization checks.

## 2026-09-05 16:20 IST — Use HR API for contract selection

### Summary
- Replaced the payroll service's direct `Contract` table query with an HR API integration.
- Added a controlled `503 Service Unavailable` response when HR contract data cannot be loaded.

### Files Changed
- `apps/payroll/src/main/java/com/dj/payroll/integration/HrContractClient.java`: Loads active period-valid contracts from the HR API.
- `apps/payroll/src/main/java/com/dj/payroll/exception/ExternalServiceException.java`: Represents unavailable upstream services.
- `apps/payroll/src/main/java/com/dj/payroll/services/PayrunService.java`: Uses the HR contract client during computation.
- `apps/payroll/src/main/resources/application.yaml`: Added configurable `HR_API_URL`.
- `apps/payroll/src/main/java/com/dj/payroll/exception/GlobalExceptionHandler.java`: Maps upstream failures to HTTP 503.

### Reason
- The repository architecture assigns employee contracts to the HR API; payroll's local database does not own the `Contract` table.

### Validation
- Not run yet after the HR integration change.

### Notes
- Payrun computation requires the HR API at `HR_API_URL` and its `/contracts` endpoint to be available.

## 2026-09-05 15:50 IST — Add local JWT fallback configuration

### Summary
- Added a development fallback JWT secret so the payroll app can start from IntelliJ when no environment variable is configured.

### Files Changed
- `apps/payroll/src/main/resources/application.yaml`: Added a 32+ character local fallback for `JWT_SECRET`.

### Reason
- IntelliJ was starting without the user-level `JWT_SECRET`, causing `SecurityConfig` construction to fail.

### Validation
- `mvn -f apps/payroll/pom.xml spring-boot:run` — run after the configuration update.

### Notes
- A real production `JWT_SECRET` environment variable overrides this development fallback and must be configured in production.

## 2026-09-05 15:55 IST — Implement payroll MVC REST API

### Summary
- Added DTO, repository, service, and controller layers for payroll rule categories, salary rules, salary structures, payruns, and payslips.
- Added payrun lifecycle processing with deterministic salary-rule ordering, contract-period selection, monetary rounding, duplicate payslip prevention, validation, payment, and cancellation flows.
- Expanded global exception handling for validation, malformed requests, data conflicts, authentication, and authorization failures.

### Files Changed
- `apps/payroll/src/main/java/com/dj/payroll/dto/`: Added validated request and response DTOs.
- `apps/payroll/src/main/java/com/dj/payroll/repositories/`: Added Spring Data repositories for payroll aggregates.
- `apps/payroll/src/main/java/com/dj/payroll/services/`: Added constructor-injected business services and payrun computation engine.
- `apps/payroll/src/main/java/com/dj/payroll/controllers/`: Added protected REST endpoints under `/api/payroll`.
- `apps/payroll/src/main/java/com/dj/payroll/exception/GlobalExceptionHandler.java`: Added consistent API error handling.

### Reason
- The Java payroll service had persistence entities but no production API flow for managing salary configuration or processing payroll.

### Validation
- `mvn -f apps/payroll/pom.xml clean compile -DskipTests` — passed; 32 Java source files compiled with Java 21.
- `mvn -f pom.xml -pl apps/payroll -am test` — passed; 1 test succeeded and 7 repositories loaded against PostgreSQL.
- `git diff --check` — passed.

### Notes
- Formula salary rules intentionally return a controlled error until a formula engine is configured; fixed and percentage rules are implemented.
- Payrun computation reads active contracts from the shared Prisma PostgreSQL schema for the requested period.

## 2026-09-05 16:10 IST — Harden payroll transaction boundaries

### Summary
- Added pessimistic payrun row locking for compute, validate, pay, and cancel transitions.
- Added database unique constraints matching Prisma's duplicate payslip and structure-rule protections.

### Files Changed
- `apps/payroll/src/main/java/com/dj/payroll/repositories/PayrunRepository.java`: Added a `PESSIMISTIC_WRITE` lookup for state-changing operations.
- `apps/payroll/src/main/java/com/dj/payroll/services/PayrunService.java`: Uses the locked payrun lookup for lifecycle transitions.
- `apps/payroll/src/main/java/com/dj/payroll/entities/Payslip.java`: Added the `(payrunId, employeeId)` unique constraint.
- `apps/payroll/src/main/java/com/dj/payroll/entities/SalaryStructureRule.java`: Added the `(salaryStructureId, salaryRuleId)` unique constraint.

### Reason
- Prevent concurrent requests from processing the same payrun twice and preserve schema-level duplicate protections.

### Validation
- `mvn -f apps/payroll/pom.xml clean compile -DskipTests` — run after transaction hardening.
- `mvn -f pom.xml -pl apps/payroll -am test` — run after transaction hardening.

### Notes
- Service methods use Spring's default `REQUIRED` transaction propagation; runtime business exceptions roll back the complete payrun operation.

## 2026-09-05 16:08 IST � Verify and harden payroll APIs

### Summary
- Added explicit RestClient builder configuration for the HR contract client.
- Added payrun service unit tests covering computation, lifecycle state rejection, rounding, and empty-payslip validation.
- Fixed salary structure updates so replaced assignments are flushed before reinsertion.

### Files Changed
- `apps/payroll/src/main/java/com/dj/payroll/integration/RestClientConfig.java`: Registers the constructor-injected RestClient builder.
- `apps/payroll/src/main/java/com/dj/payroll/services/SalaryStructureService.java`: Flushes deleted assignments before saving replacements.
- `apps/payroll/src/test/java/com/dj/payroll/services/PayrunServiceTest.java`: Added three unit tests for payroll processing behavior.

### Reason
- The application context could not start without a RestClient builder, and structure updates could conflict with the unique structure-rule constraint.

### Validation
- `mvn -f pom.xml -pl apps/payroll -am test` � passed; 4 tests succeeded.
- Runtime smoke checks on port 8081 � authentication, CRUD, validation, not-found handling, payrun reads, payslip listing, and structure update passed.
- Payrun compute returned controlled HTTP 503 because the configured HR API was unavailable.
- `git diff --check` � passed.

### Notes
- Full payrun compute, validate, and paid lifecycle requires the HR API `/contracts` endpoint to be running and returning period-valid active contracts.
- Local smoke records were created in the development database for verification.

## 2026-09-05 16:47 +05:30 — Complete HR API model routes

### Summary
- Added backend API routes for the remaining normalized PeoplePay360 models and payroll workflow operations.
- Added a basic payrun compute lifecycle that generates/upserts payslips from active contracts and salary structure rules.

### Files Changed
- `apps/hr-api/src/modules/shared/hr.service.ts`: Added bank account, working schedule, time-off type, allocation, salary rule/category/structure, payrun, payslip, RBAC, and user operations.
- `apps/hr-api/src/modules/bank-accounts/bank-accounts.controller.ts`: Added bank account CRUD routes.
- `apps/hr-api/src/modules/working-schedules/working-schedules.controller.ts`: Added working schedule and schedule-day CRUD routes.
- `apps/hr-api/src/modules/payroll/payroll.controller.ts`: Added salary, payrun, payslip, and payroll lifecycle routes.
- `apps/hr-api/src/modules/rbac/rbac.controller.ts`: Added role, permission, role-permission, and user-role assignment routes.
- `apps/hr-api/src/modules/time-off/time-off.controller.ts`: Added time-off type and allocation routes.
- `apps/hr-api/src/modules/users/users.controller.ts`: Added user detail/create/update/delete routes.
- `apps/hr-api/src/modules/hr.module.ts`: Registered the new API controllers.
- `CHANGELOG_AGENTS.md`: Recorded this API work.

### Reason
- The normalized schema had models that were not reachable through the API layer, leaving large parts of the backend workflow unavailable.

### Validation
- `pnpm --filter @peoplepay360/hr-api build` — passed

### Notes
- Controllers currently follow the existing pattern of accepting Prisma input types directly; DTO validation and authorization guards are still needed before production exposure.
- Payrun computation supports fixed and percentage rules. Formula rules currently compute as zero until a formula engine/parser is defined.

## 2026-09-05 17:17 +05:30 — Capture hackathon product context

### Summary
- Added the HR & Payroll hackathon brief, role scope, demo priorities, and expected payroll deliverables to the agent instructions.

### Files Changed
- `AGENTS.md`: Added hackathon context, delivery priorities, role permissions, two-step payrun workflow, live dashboard expectations, and PDF/email deliverables.
- `CHANGELOG_AGENTS.md`: Recorded this documentation update.

### Reason
- Future repository work needs to align with the provided hackathon problem statement and prioritize real HR/payroll business flows over static UI.

### Validation
- `git diff --check` — passed

### Notes
- This was a documentation/context update only; no application code was changed.

## 2026-09-05 17:38 +05:30 — Expand hackathon scope details

### Summary
- Expanded the agent instructions with the full HR & Payroll module breakdown, end-to-end flow requirements, dashboard expectations, and technical delivery guidelines.

### Files Changed
- `AGENTS.md`: Added detailed requirements for employee management, contracts, working schedules, attendance, time off, salary structures/rules, payruns, payslips, payroll dashboard, PDF/email delivery, demo flows, and technical priorities.
- `CHANGELOG_AGENTS.md`: Recorded this documentation update.

### Reason
- The earlier context update summarized the product statement but did not preserve enough detail for future implementation decisions.

### Validation
- `git diff --check -- AGENTS.md CHANGELOG_AGENTS.md` — passed

### Notes
- Prisma package.json configuration deprecation warning remains non-blocking.

## 2026-09-05  — Fix Payroll API root scripts

### Summary
- Corrected root Payroll API commands to use the actual Maven project directory.

### Files Changed
- `package.json`: Updated `dev:payroll` and `build:payroll` from `apps/payroll-api` to `apps/payroll`.
- `CHANGELOG_AGENTS.md`: Recorded this change.

### Reason
- The configured `apps/payroll-api` path does not contain the Maven project; the source and `pom.xml` are under `apps/payroll`.

### Validation
- `mvn -q test` from `apps/payroll` — could not complete initially because Maven attempted to write to inaccessible `C:\.m2\repository`.
- `mvn "-Dmaven.repo.local=D:\\oddo1\\peoplePay360\\.m2-local" test -q` with Java 21 — passed; 4 tests succeeded.
- `git diff --check` — passed.

### Notes
- Existing Surefire reports showed 4 Payroll tests passing before this change.
- The machine defaulted to Java 8; Maven test execution requires the installed Java 21 runtime specified by the project.
- HR package validation was not completed because pnpm could not verify the locked pnpm 11.19.0 registry signature in the local environment.
- `apps/payroll/src/main/java/com/dj/payroll/exception/ApiErrorResponse.java` had a pre-existing whitespace-only modification and was not changed.

## 2026-09-05  — Document Payroll API endpoints

### Summary
- Added a complete local-use and endpoint reference for the Java Payroll API.

### Files Changed
- `docs/PAYROLL_API.md`: Documented authentication, configuration, salary rules, salary structures, payruns, payslips, examples, lifecycle, and known limitations.
- `CHANGELOG_AGENTS.md`: Recorded this documentation change.

### Reason
- The Java API needed a single reference that can be used to manually verify every available endpoint and its request format.

### Validation
- Controller and DTO source inspection — passed; all currently mapped Java endpoints are included.
- `git diff --check` — passed.

### Notes
- Swagger/OpenAPI is not currently configured, so the Markdown document is the source-level endpoint reference.

## 2026-09-05  — Add API reference to AGENTS instructions

### Summary
- Added the HR and Payroll API endpoint maps and runtime requirements to the agent instructions.

### Files Changed
- `AGENTS.md`: Documented both backend base URLs, start/test commands, authentication, endpoints, dependencies, and known limitations.
- `CHANGELOG_AGENTS.md`: Recorded this documentation change.

### Reason
- Agents need the complete API contract in the repository instructions when implementing or validating backend changes.

### Validation
- Controller source inspection — passed; HR and Payroll endpoint mappings were checked against source controllers.
- `git diff --check` — passed.

### Notes
- Request-body examples remain in `docs/PAYROLL_API.md`.

## 2026-09-05  — Verify APIs with separate HR database

### Summary
- Created the local `oddo_hr` database, applied the committed HR Prisma migration, and completed live checks for both APIs.

### Files Changed
- `AGENTS.md`: Documented the required dedicated HR database and migration command.
- `docs/PAYROLL_API.md`: Added the local HR database setup note.
- `CHANGELOG_AGENTS.md`: Recorded the verification and configuration note.

### Reason
- The HR API returned `500` because its Prisma tables were missing and the Payroll database contained incompatible schema/data. A separate HR database preserves the Payroll schema and allows HR migrations to apply cleanly.

### Validation
- `pnpm --filter @peoplepay360/db exec prisma generate` — passed.
- `pnpm --filter @peoplepay360/db exec prisma migrate deploy` against `oddo_hr` — passed.
- HR TypeScript check — passed.
- HR live endpoints — all 8 returned `200`; dashboard returned zero-count data.
- Payroll live startup with Java 21 — passed on port `8080`; protected payrun endpoint returned expected `401` without a JWT.
- `git diff --check` — passed.

### Notes
- HR requires `DATABASE_URL` pointing to `oddo_hr` when started.
- Local `oddo_hr` database creation is an environment setup action; no existing Payroll data was reset or deleted.
- This was a documentation/context update only; no application code was changed.
