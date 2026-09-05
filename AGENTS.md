# AGENTS.md

## Project Overview

PeoplePay360 is an integrated HR and Payroll platform that manages employee records, employment contracts, working schedules, attendance, time off, salary structures, salary rules, payruns, payslips, payroll validation, payment status, reporting, and employee delivery.

The system must prioritize accurate business logic, reliable data relationships, historical tracking, role-based access, and an end-to-end employee-to-payslip workflow over superficial UI implementation.

## API Reference

The repository contains two backend APIs. Keep this endpoint map synchronized with controller changes.

### HR API — NestJS

- Base URL: `http://localhost:3001/api/hr`
- Source: `apps/hr-api`
- Start: `pnpm dev:hr`
- Build: `pnpm --filter @peoplepay360/hr-api build`
- Current controllers are read-only list/dashboard endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/hr/employees` | List employees |
| GET | `/api/hr/departments` | List departments |
| GET | `/api/hr/job-positions` | List job positions |
| GET | `/api/hr/contracts` | List contracts |
| GET | `/api/hr/attendance` | List attendance records |
| GET | `/api/hr/time-off/requests` | List time-off requests |
| GET | `/api/hr/users` | List users |
| GET | `/api/hr/dashboard` | Get HR dashboard data |

The HR API uses a dedicated PostgreSQL database through Prisma and requires `DATABASE_URL` (local development: `postgresql://postgres:root@localhost:5432/oddo_hr`). Do not point HR at the Payroll `oddo` database because their schemas are different. Apply the HR schema with `pnpm --filter @peoplepay360/db exec prisma migrate deploy` after setting `DATABASE_URL`. CORS defaults to `http://localhost:3000`; the port defaults to `3001` and can be changed with `PORT`. The HR API currently has no real automated test suite; its package `test` script is a placeholder.

### Payroll API — Java/Spring Boot

- Base URL: `http://localhost:8080`
- Source: `apps/payroll`
- Start: `pnpm dev:payroll`
- Test/build: `pnpm build:payroll`
- Detailed examples: [`docs/PAYROLL_API.md`](docs/PAYROLL_API.md)
- All `/api/payroll/**` endpoints require a Bearer JWT with `role` equal to `ADMIN`, `PAYROLL_MANAGER`, or `HR_MANAGER`.

#### Salary rule categories

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/payroll/salary-rule-categories` | List categories |
| GET | `/api/payroll/salary-rule-categories/{id}` | Get category |
| POST | `/api/payroll/salary-rule-categories` | Create category |
| PUT | `/api/payroll/salary-rule-categories/{id}` | Update category |
| DELETE | `/api/payroll/salary-rule-categories/{id}` | Delete category |

#### Salary rules and structures

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/payroll/salary-rules` | List rules; optional `categoryId` query parameter |
| GET | `/api/payroll/salary-rules/{id}` | Get rule |
| POST | `/api/payroll/salary-rules` | Create rule |
| PUT | `/api/payroll/salary-rules/{id}` | Update rule |
| DELETE | `/api/payroll/salary-rules/{id}` | Deactivate rule |
| GET | `/api/payroll/salary-structures` | List structures |
| GET | `/api/payroll/salary-structures/{id}` | Get structure |
| POST | `/api/payroll/salary-structures` | Create structure with rule assignments |
| PUT | `/api/payroll/salary-structures/{id}` | Update structure |

#### Payruns and payslips

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/payroll/payruns` | List payruns |
| GET | `/api/payroll/payruns/{id}` | Get payrun |
| POST | `/api/payroll/payruns` | Create payrun |
| POST | `/api/payroll/payruns/{id}/compute` | Compute payslips |
| POST | `/api/payroll/payruns/{id}/validate` | Validate payrun and return warnings |
| POST | `/api/payroll/payruns/{id}/pay` | Mark payrun paid |
| POST | `/api/payroll/payruns/{id}/cancel` | Cancel payrun |
| GET | `/api/payroll/payruns/{payrunId}/payslips` | List payrun payslips |
| GET | `/api/payroll/payslips/{id}` | Get payslip with lines |

Payroll requires PostgreSQL (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`) and Java 21. Payrun computation also requires the HR API at `HR_API_URL` and currently cannot execute `FORMULA` salary rules because no formula engine is configured. The Java test suite currently contains 4 passing tests when run with Java 21.

## Purpose of This File

This document defines the engineering standards, workflow, and operating rules for all AI agents and automated contributors working in this repository.

All agents must follow these instructions unless a higher-priority repository or platform instruction explicitly overrides them.

## Core Engineering Principles

1. Prefer correctness and maintainability over speed or unnecessary complexity.
2. Preserve existing functionality unless the requested change explicitly requires a behavior change.
3. Reuse established project patterns before introducing new abstractions, libraries, or architectural conventions.
4. Keep business logic separate from presentation, transport, and persistence concerns where practical.
5. Avoid hardcoded business rules when the behavior should be configurable.
6. Validate user input and enforce authorization at the appropriate backend boundaries.
7. Treat financial calculations and payroll records as sensitive and accuracy-critical.
8. Make changes small, focused, reviewable, and easy to revert.
9. Do not modify unrelated files merely to improve formatting or style.
10. Never claim that a change works without running the relevant checks or clearly stating that checks were not run.

## Project Domain Rules

### Employee and Contract Management

- Employees are the central entity connecting contracts, schedules, attendance, time off, and payroll.
- Contracts must preserve historical employment terms.
- Payroll must use the contract applicable to the selected payroll period.
- Avoid allowing conflicting active contracts for the same employee and period unless the business rules explicitly support them.
- A salary change may be represented by a new contract or an explicitly versioned contract update, but historical salary terms must not be silently lost.

### Attendance and Working Schedules

- Working schedules define expected working days, start times, end times, breaks, and weekly hours.
- Attendance records represent actual presence and working time.
- Attendance exceptions must be reviewable.
- Manual attendance corrections must be restricted to authorized users and should be auditable.
- Payroll calculations must use the correct attendance and working-time context for the relevant period.

### Time Off

- Time-off types define leave policies, units, allocation requirements, approval workflows, and payroll behavior.
- Allocations represent leave assigned to an employee.
- Approved requests must update the relevant leave balance according to the configured policy.
- Leave approval and balance consumption must be consistent and protected against duplicate deductions.

### Salary Structures and Rules

- A salary structure is a reusable collection of salary rules.
- Salary rules calculate earnings, allowances, deductions, contributions, gross salary, and net salary.
- Rules must execute in a deterministic sequence.
- Rule dependencies must be respected.
- Supported computation methods may include fixed amounts, percentages, and formulas.
- Do not duplicate salary-calculation logic across controllers, UI components, jobs, and reports.
- Financial calculations must handle rounding consistently and explicitly.

### Payruns and Payslips

- A payrun is a payroll-processing batch for a specific period, salary structure, and selected employees.
- A payslip is the individual salary statement generated for one employee within a payrun.
- A payrun may contain many payslips.
- Payrun processing should follow a controlled lifecycle such as:
  1. Draft or setup
  2. Employee selection
  3. Compute
  4. Validate
  5. Review warnings
  6. Mark paid or finalize
  7. Generate and distribute payslips
- Finalized or paid payroll records must remain available for historical reporting.
- Duplicate payslips, missing required information, invalid contracts, and calculation issues must be surfaced before finalization.

## Repository Exploration Rules

Before changing code:

1. Inspect the repository structure.
2. Identify the application entry points and package manager.
3. Read the relevant README, configuration files, and existing documentation.
4. Locate the module, service, component, or route responsible for the requested behavior.
5. Check existing tests and established naming, validation, error-handling, and logging patterns.
6. Confirm whether the requested functionality already exists before implementing it again.

Do not make broad changes based only on filenames or assumptions.

## Implementation Workflow

For every task:

1. Restate the requested outcome internally and identify the affected areas.
2. Inspect relevant code and dependencies.
3. Plan the smallest complete implementation.
4. Implement the change using existing conventions.
5. Add or update tests where applicable.
6. Run relevant formatting, linting, type-checking, build, and test commands.
7. Review the diff for unintended changes, secrets, debug statements, and unrelated modifications.
8. Update the mandatory agent change log described below.
9. Report the implementation, validation results, and any remaining limitations.

## Mandatory Agent Change Log

Every agent that makes a repository change MUST log the change before completing the task.

The log must be maintained in:

```text
CHANGELOG_AGENTS.md
```

If the file does not exist, the agent must create it.

### Required Log Entry Format

Each entry must include:

- Date and time, preferably in ISO 8601 format
- Agent or task identifier, if available
- Short summary of the change
- Files added, modified, or deleted
- Reason for the change
- Tests, checks, or commands run
- Result of those checks
- Any known limitations, follow-up work, or risks

Use the following format:

```markdown
## YYYY-MM-DD HH:MM TZ — <Task or Agent Identifier>

### Summary
- <Short description of the change>

### Files Changed
- `path/to/file`: <what changed>
- `path/to/another-file`: <what changed>

### Reason
- <Why the change was necessary>

### Validation
- `<command>` — <passed, failed, or not run>

### Notes
- <Known limitations, assumptions, follow-up work, or risks>
```

### Change Log Rules

- Do not delete or rewrite previous entries unless explicitly instructed.
- Append new entries; preserve chronological history.
- Log documentation-only, configuration, dependency, database, frontend, backend, and test changes.
- If a task changes multiple areas, list every relevant file or directory.
- If validation could not be run, state the reason honestly.
- Never claim tests passed if they were not executed.
- The change log is part of the deliverable, not an optional administrative step.

## Code Quality Standards

- Use clear, descriptive names.
- Keep functions and modules focused on one responsibility.
- Avoid deeply nested conditionals when guard clauses or extracted functions improve clarity.
- Handle errors explicitly and return consistent error responses.
- Avoid swallowing exceptions.
- Do not leave temporary debugging code, commented-out experiments, or unused imports.
- Prefer typed interfaces and validation schemas where the project supports them.
- Keep API contracts stable unless a breaking change is intentional and documented.
- Use environment variables for secrets and environment-specific configuration.
- Never commit API keys, passwords, tokens, private keys, or personal employee data.

## Database and Data Integrity

- Review schema relationships before changing models.
- Preserve referential integrity.
- Use migrations for schema changes when supported by the project.
- Avoid destructive data changes without explicit authorization.
- Consider duplicate records, null values, historical records, and concurrent updates.
- For payroll data, ensure calculations are reproducible from stored inputs and rules.

## Security and Access Control

- Enforce authentication and authorization on protected operations.
- Follow the repository's role-based access-control conventions.
- Do not expose salary, bank, contract, or employee information to unauthorized users.
- Validate ownership and role permissions on the server, not only in the frontend.
- Avoid logging sensitive personal or financial information.

## Testing Requirements

When applicable, add tests for:

- Salary-rule calculations
- Gross and net salary calculations
- Contract selection by payroll period
- Payrun state transitions
- Duplicate payslip prevention
- Leave allocation and balance updates
- Attendance corrections and exceptions
- Role and permission enforcement
- API validation and error handling

At minimum, run the narrowest relevant checks first, then broader checks when practical.

## Git and Commit Guidelines

- Work on the requested branch or task branch.
- Do not reset, rebase, force-push, or delete branches unless explicitly authorized.
- Do not overwrite another contributor's work.
- Keep commits focused when commits are requested.
- Use clear commit messages describing the change.
- Review `git diff` and `git status` before finishing.
- Never commit generated secrets, local environment files, or unrelated changes.

## Communication and Completion Report

When completing a task, report:

1. What was changed
2. Why it was changed
3. Important implementation details
4. Files changed
5. Validation commands and results
6. Any limitations or follow-up work
7. Confirmation that `CHANGELOG_AGENTS.md` was updated

Be concise but precise. Do not hide failures or unresolved issues.

## Definition of Done

A task is complete only when:

- The requested behavior is implemented.
- Existing behavior has not been unnecessarily broken.
- Relevant validation has been performed or transparently marked as not run.
- The diff has been reviewed.
- No secrets or unrelated changes were introduced.
- The mandatory agent change log has been updated.
- The completion report accurately describes the result.
