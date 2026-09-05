import { z } from "zod";

export const timeOffTypeSchema = z.object({
  name: z.string().min(1),
  unit: z.enum(["DAYS", "HOURS"]).default("DAYS"),
  requiresAllocation: z.boolean().default(true),
  paid: z.boolean().default(true),
  approvalRequired: z.boolean().default(true)
});

export const timeOffRequestSchema = z
  .object({
    employeeId: z.string().min(1),
    timeOffTypeId: z.string().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    quantity: z.coerce.number().positive(),
    reason: z.string().optional()
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "Time-off end date must be on or after the start date.",
    path: ["endDate"]
  });

export type TimeOffTypeInput = z.infer<typeof timeOffTypeSchema>;
export type TimeOffRequestInput = z.infer<typeof timeOffRequestSchema>;
