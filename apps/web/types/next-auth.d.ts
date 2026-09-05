import type { UserRole } from "@peoplepay360/db";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: UserRole;
      employeeId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    employeeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    employeeId?: string | null;
  }
}
