import type { UserRole as PrismaUserRole } from "@peoplepay360/db";

export type RoleKey = PrismaUserRole | "HR_PAYROLL_MANAGER" | "HR_PAYROLL_USER";

export type RoleMeta = {
  label: string;
  background: string;
  foreground: string;
};

export const ROLE_META: Record<RoleKey, RoleMeta> = {
  ADMIN: {
    label: "Admin",
    background: "#EFEAFB",
    foreground: "#4B3A91",
  },
  HR_MANAGER: {
    label: "HR Manager",
    background: "#E7F0FB",
    foreground: "#1F4E8C",
  },
  PAYROLL_MANAGER: {
    label: "Payroll Manager",
    background: "#FBEAE3",
    foreground: "#8C3A1F",
  },
  HR_PAYROLL_MANAGER: {
    label: "HR Payroll Manager",
    background: "#FBEAE3",
    foreground: "#8C3A1F",
  },
  HR_PAYROLL_USER: {
    label: "HR Payroll User",
    background: "#FBF2DC",
    foreground: "#8C6A1F",
  },
  EMPLOYEE: {
    label: "Employee",
    background: "#EFEEEA",
    foreground: "#55534C",
  },
};

export function getRoleMeta(role: RoleKey) {
  return ROLE_META[role];
}
