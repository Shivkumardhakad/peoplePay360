import { z } from "zod";

export const contractSchema = z
  .object({
    employeeId: z.string().min(1),
    salaryStructureId: z.string().min(1),
    positionId: z.string().min(1).optional(),
    departmentId: z.string().min(1).optional(),
    workingScheduleId: z.string().min(1).optional(),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]).default("FULL_TIME"),
    title: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    baseSalary: z.coerce.number().nonnegative(),
    wage: z.coerce.number().nonnegative().optional(),
    weeklyHours: z.coerce.number().positive(),
    currency: z.string().length(3).default("USD"),
    payrollProfileCode: z.string().min(1).transform((value) => value.toUpperCase()),
    status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).default("ACTIVE")
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "Contract end date must be on or after the start date.",
    path: ["endDate"]
  });

export type ContractInput = z.infer<typeof contractSchema>;
