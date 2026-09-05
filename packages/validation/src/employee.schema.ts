import { z } from "zod";

export const employeeSchema = z.object({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  departmentId: z.string().min(1).optional(),
  jobPositionId: z.string().min(1).optional(),
  hireDate: z.coerce.date(),
  status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]).default("ACTIVE")
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
