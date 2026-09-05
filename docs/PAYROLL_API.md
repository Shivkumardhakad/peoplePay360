# PeoplePay360 Payroll API

## Run locally

The Payroll API is the Java/Spring Boot service in `apps/payroll`.

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.10"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
pnpm dev:payroll
```

The default base URL is `http://localhost:8080` because no `server.port` is configured.
The API prefix is `/api/payroll`.

Required local services/configuration:

- PostgreSQL: `jdbc:postgresql://localhost:5432/oddo`
- `DB_USERNAME` and `DB_PASSWORD` (defaults are `postgres` and `root`)
- HR API for payrun computation: `HR_API_URL` (default: `http://localhost:3001/api/hr`)
- `JWT_SECRET` must be at least 32 characters; the development default is present in `application.yaml`.

## Authentication

All `/api/payroll/**` endpoints require a Bearer JWT. The token must contain a `role` claim with one of:

- `ADMIN`
- `PAYROLL_MANAGER`
- `HR_MANAGER`

Example header:

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

Unauthenticated requests return `401`; a token without an allowed role returns `403`.

Permissions are endpoint-specific: `HR_MANAGER` has read access to reports, payslips, audits, payment status, and salary configuration; `PAYROLL_MANAGER` can also create/update payroll data and execute payrun actions; `ADMIN` has full access. Unknown future Payroll routes are restricted to `ADMIN` by default.

## Salary rule categories

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/payroll/salary-rule-categories` | — | `200` |
| GET | `/api/payroll/salary-rule-categories/{id}` | — | `200` |
| POST | `/api/payroll/salary-rule-categories` | `{ "name", "code", "type", "description" }` | `201` |
| PUT | `/api/payroll/salary-rule-categories/{id}` | `{ "name", "type", "description" }` | `200` |
| DELETE | `/api/payroll/salary-rule-categories/{id}` | — | `204` |

`type` must be `EARNING`, `DEDUCTION`, or `AGGREGATE`.

Example create request:

```json
{
  "name": "Earnings",
  "code": "EARN",
  "type": "EARNING",
  "description": "Employee earnings"
}
```

## Salary rules

| Method | Path | Body/query | Success |
|---|---|---|---|
| GET | `/api/payroll/salary-rules` | Optional `?categoryId={id}` | `200` |
| GET | `/api/payroll/salary-rules/{id}` | — | `200` |
| POST | `/api/payroll/salary-rules` | Create request | `201` |
| PUT | `/api/payroll/salary-rules/{id}` | Update request | `200` |
| DELETE | `/api/payroll/salary-rules/{id}` | — | `204` |

Create request:

```json
{
  "name": "Basic Salary",
  "code": "BASIC",
  "categoryId": "<category-id>",
  "sequence": 10,
  "calculationType": "FIXED",
  "value": 50000.00,
  "formula": null
}
```

`calculationType` is `FIXED`, `PERCENTAGE`, or `FORMULA`. `sequence` must be zero or greater. Salary rule deletion deactivates the rule rather than removing its history.

## Salary structures

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/payroll/salary-structures` | — | `200` |
| GET | `/api/payroll/salary-structures/{id}` | — | `200` |
| POST | `/api/payroll/salary-structures` | Create request | `201` |
| PUT | `/api/payroll/salary-structures/{id}` | Update request | `200` |

Create request:

```json
{
  "name": "Monthly Payroll",
  "code": "MONTHLY",
  "description": "Monthly salary structure",
  "rules": [
    { "salaryRuleId": "<rule-id>", "sequence": 10 }
  ]
}
```

Update additionally requires a non-blank `status`; `rules` must contain at least one assignment.

## Payruns and payslips

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/payroll/payruns` | — | `200` |
| GET | `/api/payroll/payruns/{id}` | — | `200` |
| POST | `/api/payroll/payruns` | Create request | `201` |
| POST | `/api/payroll/payruns/{id}/compute` | — | `200` |
| POST | `/api/payroll/payruns/{id}/validate` | — | `200` |
| POST | `/api/payroll/payruns/{id}/pay` | — | `200` |
| POST | `/api/payroll/payruns/{id}/cancel` | — | `200` |
| GET | `/api/payroll/payruns/{payrunId}/payslips` | — | `200` |
| GET | `/api/payroll/payslips/{id}` | — | `200` |
| GET | `/api/payroll/payslips/{id}/pdf` | — | `200` PDF |

The PDF endpoint returns an inline `application/pdf` response. It requires the same Bearer JWT as the other Payroll endpoints and includes the payslip header, period, totals, and salary-rule lines.

## Reports

Reports use persisted payruns and payslips and require `from` and `to` ISO date-time query parameters. `to` must be after `from`.

| Method | Path | Query | Success |
|---|---|---|---|
| GET | `/api/payroll/reports/summary` | `from`, `to` | `200` |
| GET | `/api/payroll/reports/payslips` | `from`, `to`, optional `status` | `200` |

Example: `/api/payroll/reports/summary?from=2026-09-01T00:00:00&to=2026-10-01T00:00:00`

## Payroll auditor

`GET /api/payroll/payruns/{id}/audit` checks the real payrun and payslip records for missing payslips, duplicate employees, missing totals, negative amounts, deductions above gross, net-total mismatches, and missing salary-rule lines. It returns a risk score, pass/fail result, auditor version, and structured findings.

## Payment status

| Method | Path | Success |
|---|---|---|
| GET | `/api/payroll/payruns/{id}/payment-status` | `200` |
| GET | `/api/payroll/payslips/{id}/payment-status` | `200` |

The payrun response exposes the persisted payrun status, `paidAt`, total payslips, paid payslips, and total net amount. The payslip response exposes its status, paid timestamp, employee, payrun, and net amount. Status changes remain controlled by the existing payrun lifecycle endpoint.

## Formula salary rules

`FORMULA` salary rules now execute during payrun computation. The restricted engine supports `+`, `-`, `*`, `/`, parentheses, unary signs, numeric values, `base_salary`, `gross`, `deductions`, `net`, and earlier rule codes. Unsafe expressions, unknown variables, malformed formulas, and division by zero return a validation error.

During compute, Payroll reads period-applicable contracts from `HR_API_URL`, filters for active employees and the selected salary structure, and rejects overlapping contracts, invalid base salaries, or contracts outside the payrun period.

Before `VALIDATED` status, the API re-checks persisted payslips against the payrun period and HR contract employee scope, then validates contract IDs, non-negative totals, `net = gross - deductions`, salary-rule line presence, and line-total consistency.

Create payrun request:

```json
{
  "name": "September 2026 Payroll",
  "periodStart": "2026-09-01T00:00:00",
  "periodEnd": "2026-09-30T23:59:59",
  "salaryStructureId": "<structure-id>"
}
```

Recommended lifecycle:

```text
POST /payruns
  -> POST /payruns/{id}/compute
  -> POST /payruns/{id}/validate
  -> review warnings
  -> POST /payruns/{id}/pay
```

Use `/cancel` for a draft/setup payrun that should not be processed. Compute requires the configured HR API to return valid employee contract data for the pay period.

## Error responses

Validation, missing resources, invalid lifecycle transitions, and external HR failures are returned through the API error handler. Check the HTTP status and response `message`; do not treat a `200` response as successful unless the requested lifecycle operation completed.

## Current test status and known limitations

- Java 21 Payroll test run: 4 tests passed (1 application context test and 3 payrun service tests).
- `FORMULA` salary rules currently return an error because no formula engine is configured.
- Payrun compute depends on the HR API being available and returning period-valid contracts.
- There is no generated OpenAPI/Swagger endpoint configured yet; this document is the current endpoint reference.

## HR API local database note

The HR API must use its own database, separate from the Payroll `oddo` database. For local setup:

```powershell
$env:DATABASE_URL = "postgresql://postgres:root@localhost:5432/oddo_hr"
pnpm --filter @peoplepay360/db exec prisma migrate deploy
pnpm dev:hr
```
