import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email address is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginSchemaInput = z.infer<typeof loginSchema>;
