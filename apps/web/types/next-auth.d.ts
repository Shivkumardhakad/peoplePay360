import type { UserRole } from "@peoplepay360/db";
import type { DefaultSession } from "next-auth";

export type AppRole = UserRole | "HR_PAYROLL_MANAGER";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: AppRole;
      employeeId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: AppRole;
    employeeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    employeeId?: string | null;
  }
}
