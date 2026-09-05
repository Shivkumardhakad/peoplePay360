# PeoplePay360

Integrated HR and payroll management platform.

## Service Ownership

PeoplePay360 is scaffolded as a polyglot monorepo with a deliberate boundary between HR operations and payroll processing.

### Node / NestJS HR API

`apps/hr-api` owns HR-facing resources and exposes them under `/api/hr`:

- Employees
- Departments
- Job positions
- Contracts
- Working schedules
- Attendance
- Time off
- Users / RBAC
- HR dashboard data

The HR API uses the Prisma package in `packages/db`. Its schema intentionally stops at HR and contract data. Contracts include `payrollProfileCode`, which is the handoff key for the payroll service.

### Java / Spring Boot Payroll API

`apps/payroll-api` owns payroll-facing resources and exposes them under `/api/payroll`:

- Salary structures
- Salary rules
- Payruns
- Payroll engine
- Payslips
- Payroll validation
- PDF generation
- AI payroll auditor

Payroll database migrations live in the Spring service under `apps/payroll-api/src/main/resources/db/migration`.

### Web App

`apps/web` is the Next.js frontend. It should call the HR API for HR data and the Payroll API for payroll workflows.

## Local Setup

Install Java, Maven, Node.js, pnpm, and PostgreSQL, then run:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm dev:payroll
```

Set these local environment variables before database commands:

- `DATABASE_URL` for the HR Prisma schema, using a PostgreSQL connection string
- `PAYROLL_DATABASE_URL`, `PAYROLL_DATABASE_USER`, and `PAYROLL_DATABASE_PASSWORD` for the Spring payroll service
