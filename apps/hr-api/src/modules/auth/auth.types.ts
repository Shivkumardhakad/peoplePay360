export const HR_ADMIN_ROLES = ["ADMIN", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "PAYROLL_MANAGER"] as const;
export const PAYROLL_ADMIN_ROLES = ["ADMIN", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "PAYROLL_MANAGER"] as const;
export const SYSTEM_ADMIN_ROLES = ["ADMIN"] as const;
export const EMPLOYEE_SELF_SERVICE_ROLES = ["EMPLOYEE"] as const;

export type AuthRole =
  | "ADMIN"
  | "HR_MANAGER"
  | "HR_PAYROLL_USER"
  | "HR_PAYROLL_MANAGER"
  | "PAYROLL_MANAGER"
  | "EMPLOYEE";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  name?: string;
  role: AuthRole;
  employeeId?: string | null;
};

export type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
};
