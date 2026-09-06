import { z } from "zod";

const id = z.string().trim().min(1);
const date = z.coerce.date();
const optionalDate = date.nullish();
const personName = z.string().trim().min(2).max(100).regex(/^[\p{L}][\p{L}\s.'-]*$/u, "Name contains invalid characters");

export const employeeApiSchema = z.object({
  employeeNumber: z.string().trim().min(1).max(50),
  firstName: personName,
  lastName: personName,
  email: z.email().transform((value) => value.trim().toLowerCase()),
  phone: z.string().trim().max(50).nullish(),
  dateOfBirth: optionalDate,
  gender: z.string().trim().max(40).nullish(),
  address: z.string().trim().max(500).nullish(),
  bankAccountId: id.nullish(),
  departmentId: id.nullish(),
  jobPositionId: id.nullish(),
  hireDate: date,
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]).default("ACTIVE")
});
export const employeeUpdateApiSchema = employeeApiSchema.partial();

export const attendanceApiSchema = z.object({
  employeeId: id,
  workingScheduleId: id.nullish(),
  date,
  checkIn: optionalDate,
  checkOut: optionalDate,
  breakMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  workedMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "REMOTE", "EXCEPTION"]).default("PRESENT"),
  correctionReason: z.string().trim().max(500).nullish()
}).superRefine((value, context) => {
  if (value.checkIn && value.checkOut && value.checkOut < value.checkIn) {
    context.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in" });
  }
});
export const attendanceUpdateApiSchema = attendanceApiSchema.omit({ employeeId: true }).partial();

export const timeOffTypeApiSchema = z.object({
  name: z.string().trim().min(1).max(100),
  unit: z.enum(["DAYS", "HOURS"]).default("DAYS"),
  requiresAllocation: z.boolean().default(true),
  paid: z.boolean().default(true),
  approvalRequired: z.boolean().default(true),
  code: z.string().trim().min(1).max(30).nullish(),
  payrollBehavior: z.string().trim().min(1).max(30).default("PAID"),
  description: z.string().trim().max(500).nullish(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

export const allocationApiSchema = z.object({
  employeeId: id,
  timeOffTypeId: id,
  periodStart: date,
  periodEnd: date,
  allocated: z.coerce.number().positive(),
  consumed: z.coerce.number().min(0).default(0),
  remaining: z.coerce.number().min(0).optional(),
  validFrom: optionalDate,
  validTo: optionalDate,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
}).superRefine((value, context) => {
  if (value.periodEnd < value.periodStart) context.addIssue({ code: "custom", path: ["periodEnd"], message: "Period end must be on or after period start" });
  if (value.consumed > value.allocated) context.addIssue({ code: "custom", path: ["consumed"], message: "Consumed leave cannot exceed allocated leave" });
  if (value.validFrom && value.validTo && value.validTo < value.validFrom) context.addIssue({ code: "custom", path: ["validTo"], message: "Valid-to must be on or after valid-from" });
});

export const timeOffRequestApiSchema = z.object({
  employeeId: id,
  timeOffTypeId: id,
  startDate: date,
  endDate: date,
  quantity: z.coerce.number().positive(),
  reason: z.string().trim().max(1000).nullish()
}).refine((value) => value.endDate >= value.startDate, { path: ["endDate"], message: "End date must be on or after start date" });

export const myAttendanceApiSchema = attendanceApiSchema.omit({ employeeId: true, workingScheduleId: true, workedMinutes: true, correctionReason: true });
export const myTimeOffRequestApiSchema = timeOffRequestApiSchema.omit({ employeeId: true });

export const bankAccountApiSchema = z.object({
  accountName: z.string().trim().min(1).max(150),
  accountNumber: z.string().trim().min(4).max(50),
  bankName: z.string().trim().min(1).max(150),
  routingCode: z.string().trim().max(50).nullish()
});
export const bankAccountUpdateApiSchema = bankAccountApiSchema.partial();
export const loginApiSchema = z.object({ email: z.email(), password: z.string().min(1) });

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");
export const jobPositionApiSchema = z.object({
  departmentId: id.nullish(), code: z.string().trim().min(1).max(30),
  title: z.string().trim().min(1).max(150), description: z.string().trim().max(500).nullish()
});
export const jobPositionUpdateApiSchema = jobPositionApiSchema.partial();

export const workingScheduleApiSchema = z.object({
  name: z.string().trim().min(1).max(100),
  weeklyHours: z.coerce.number().positive().max(168),
  days: z.unknown(), code: z.string().trim().max(30).nullish(),
  description: z.string().trim().max(500).nullish(), status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});
export const workingScheduleUpdateApiSchema = workingScheduleApiSchema.partial();
export const workingScheduleDayApiSchema = z.object({
  dayOfWeek: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]),
  startTime: timeString.nullish(), endTime: timeString.nullish(),
  breakMinutes: z.coerce.number().int().min(0).max(1440).default(0), isWorkingDay: z.boolean().default(true)
}).superRefine((value, context) => {
  if (value.isWorkingDay && (!value.startTime || !value.endTime)) context.addIssue({ code: "custom", path: ["startTime"], message: "Working days require start and end times" });
  if (value.startTime && value.endTime && value.endTime <= value.startTime) context.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time" });
});
export const workingScheduleDayUpdateApiSchema = workingScheduleDayApiSchema.partial();

export const userApiSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()), name: personName,
  role: z.enum(["ADMIN", "HR_MANAGER", "PAYROLL_MANAGER", "HR_PAYROLL_USER", "EMPLOYEE"]).default("EMPLOYEE"),
  employeeId: id.nullish(), password: z.string().min(8).optional(), temporaryPassword: z.string().min(8).optional()
}).refine((value) => Boolean(value.password || value.temporaryPassword), { message: "Password is required" });
export const userUpdateApiSchema = userApiSchema.partial().omit({ email: true }).extend({ email: z.email().optional() });

export const salaryRuleCategoryApiSchema = z.object({
  name: z.string().trim().min(1).max(100), code: z.string().trim().min(1).max(30),
  type: z.enum(["EARNING", "DEDUCTION", "AGGREGATE"]), description: z.string().trim().max(500).nullish()
});
export const salaryRuleCategoryUpdateApiSchema = salaryRuleCategoryApiSchema.partial();
export const salaryRuleApiSchema = z.object({
  name: z.string().trim().min(1).max(150), code: z.string().trim().min(1).max(30), categoryId: id,
  sequence: z.coerce.number().int().min(0), calculationType: z.enum(["FIXED", "PERCENTAGE", "FORMULA"]),
  value: z.coerce.number().min(0).optional(), formula: z.string().trim().max(1000).optional(), status: z.enum(["ACTIVE", "INACTIVE"]).optional()
}).superRefine((value, context) => {
  if (value.calculationType === "FORMULA" && !value.formula) context.addIssue({ code: "custom", path: ["formula"], message: "Formula is required" });
  if (value.calculationType !== "FORMULA" && value.value === undefined) context.addIssue({ code: "custom", path: ["value"], message: "Value is required" });
});
export const salaryRuleUpdateApiSchema = salaryRuleApiSchema.partial();
export const salaryStructureApiSchema = z.object({ name: z.string().trim().min(1).max(150), code: z.string().trim().min(1).max(30), description: z.string().trim().max(500).nullish(), status: z.enum(["ACTIVE", "INACTIVE"]).optional() });
export const salaryStructureUpdateApiSchema = salaryStructureApiSchema.partial();
export const salaryStructureRuleApiSchema = z.object({ salaryStructureId: id, salaryRuleId: id, sequence: z.coerce.number().int().min(0) });
export const salaryStructureRuleUpdateApiSchema = salaryStructureRuleApiSchema.partial().omit({ salaryStructureId: true });
export const payrunApiSchema = z.object({
  name: z.string().trim().min(1).max(150), periodStart: date, periodEnd: date, salaryStructureId: id, employeeIds: z.array(id).min(1)
}).refine((value) => value.periodEnd > value.periodStart, { path: ["periodEnd"], message: "Period end must be after period start" }).refine((value) => new Set(value.employeeIds).size === value.employeeIds.length, { path: ["employeeIds"], message: "Duplicate employees are not allowed" });

export const roleApiSchema = z.object({ name: z.string().trim().min(1).max(100), description: z.string().trim().max(500).nullish() });
export const roleUpdateApiSchema = roleApiSchema.partial();
export const permissionApiSchema = z.object({
  name: z.string().trim().min(1).max(100), resource: z.string().trim().min(1).max(100),
  action: z.string().trim().min(1).max(50), description: z.string().trim().max(500).nullish()
});
export const rolePermissionApiSchema = z.object({ roleId: id, permissionId: id });
export const userRoleAssignmentApiSchema = z.object({ userId: id, roleId: id });
export const payslipUpdateApiSchema = z.object({
  grossAmount: z.coerce.number().min(0).optional(), deductionAmount: z.coerce.number().min(0).optional(),
  netAmount: z.coerce.number().min(0).optional(), status: z.enum(["DRAFT", "COMPUTED", "VALIDATED", "PAID", "CANCELLED"]).optional(), pdfPath: z.string().trim().max(500).nullish()
});
