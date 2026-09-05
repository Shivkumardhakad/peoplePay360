"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  Clock,
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";

export type Session = {
  user: {
    id: string;
    name: string;
    role: "ADMIN" | "HR_MANAGER" | "PAYROLL_MANAGER" | "HR_PAYROLL_USER" | "EMPLOYEE";
    employeeId: string | null;
  };
};

export const MOCK_SESSION: Session = {
  user: {
    id: "1",
    name: "Admin User",
    role: "ADMIN",
    employeeId: null,
  },
};

export function AppSidebar({ session = MOCK_SESSION }: { session?: Session }) {
  const pathname = usePathname();
  const role = session.user.role;
  const isEmployee = role === "EMPLOYEE";
  const isHRManagerOnly = role === "HR_MANAGER";
  const isAdmin = role === "ADMIN";
  const employeeProfileHref = session.user.employeeId
    ? `/employees/${session.user.employeeId}`
    : "/employees";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-56 shrink-0 min-h-screen flex flex-col border-r border-border bg-sidebar bg-muted/20 select-none">
      {/* Brand Header */}
      <div className="h-12 border-b border-border flex items-center px-4 gap-2.5">
        <div className="w-5 h-5 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px] font-mono shadow-xs">
          P
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-bold tracking-tight text-foreground">PeoplePay360</span>
          <span className="text-[10px] text-muted-foreground font-mono">HR</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {!isEmployee && (
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
              isActive("/dashboard")
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>Dashboard</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            href="/users"
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
              isActive("/users")
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>Team & Roles</span>
          </Link>
        )}

        <div className="pt-2.5 pb-1 px-2">
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider font-mono">
            Core HR
          </span>
        </div>

        {isEmployee ? (
          <Link
            href={employeeProfileHref}
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
              isActive("/employees")
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>My Profile</span>
          </Link>
        ) : (
          <>
            <Link
              href="/employees"
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                isActive("/employees")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Employees</span>
            </Link>
            <Link
              href="/contracts"
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                isActive("/contracts")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Contracts</span>
            </Link>
          </>
        )}

        <Link
          href="/attendance"
          className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
            isActive("/attendance")
              ? "bg-secondary text-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
          <span>Attendance</span>
        </Link>

        <div className="pt-2.5 pb-1 px-2">
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider font-mono">
            Time & Leave
          </span>
        </div>

        {!isEmployee ? (
          <>
            <Link
              href="/time-off/requests"
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                isActive("/time-off/requests")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Requests</span>
            </Link>
            <Link
              href="/time-off/allocations"
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                isActive("/time-off/allocations")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Allocations</span>
            </Link>
            <Link
              href="/time-off/types"
              className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                isActive("/time-off/types")
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-70" />
              <span>Leave Policies</span>
            </Link>
          </>
        ) : (
          <Link
            href="/time-off/requests"
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
              isActive("/time-off/requests")
                ? "bg-secondary text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>My Requests</span>
          </Link>
        )}

        {!isHRManagerOnly && (
          <>
            <div className="pt-2.5 pb-1 px-2">
              <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider font-mono">
                Payroll
              </span>
            </div>

            {!isEmployee ? (
              <>
                <Link
                  href="/payroll/payruns"
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isActive("/payroll/payruns")
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Payruns</span>
                </Link>
                <Link
                  href="/payroll/payslips"
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isActive("/payroll/payslips")
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Payslips</span>
                </Link>
                <Link
                  href="/payroll/structures"
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isActive("/payroll/structures")
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Structures</span>
                </Link>
                <Link
                  href="/payroll/rules"
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                    isActive("/payroll/rules")
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Salary Rules</span>
                </Link>
              </>
            ) : (
              <Link
                href="/payroll/payslips"
                className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                  isActive("/payroll/payslips")
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span>My Payslips</span>
              </Link>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span>v1.0-prod</span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" title="Online" />
      </div>
    </aside>
  );
}
