import { z } from "zod";

export const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  workingScheduleId: z.string().min(1).optional(),
  date: z.coerce.date(),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  breakMinutes: z.coerce.number().int().nonnegative().default(0),
  workedMinutes: z.coerce.number().int().nonnegative().default(0),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "REMOTE", "EXCEPTION"]).default("PRESENT"),
  correctionReason: z.string().optional()
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;
