import { z } from "zod";

export const departmentSchema = z.object({
  code: z.string().min(1).transform((value) => value.toUpperCase()),
  name: z.string().min(1),
  description: z.string().optional()
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
