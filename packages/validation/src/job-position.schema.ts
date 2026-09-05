import { z } from "zod";

export const jobPositionSchema = z.object({
  departmentId: z.string().min(1).optional(),
  code: z.string().min(1).transform((value) => value.toUpperCase()),
  title: z.string().min(1),
  description: z.string().optional()
});

export type JobPositionInput = z.infer<typeof jobPositionSchema>;
