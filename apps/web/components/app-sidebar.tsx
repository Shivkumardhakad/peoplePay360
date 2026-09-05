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
    role: "ADMIN" | "HR_MANAGER" | "PAYROLL_MANAGER" | "HR_PAYROLL_MANAGER" | "HR_PAYROLL_USER" | "EMPLOYEE";
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
  const employeeProfileHref = session.user.employeeId ? `/employees/${session.user.employeeId}` : "/employees";

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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {!isEmployee && (
            <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
          )}

          {/* Admin-only: user & role management */}
          {isAdmin && (
            <NavLink href="/users" icon={Shield} accent>Team &amp; Roles</NavLink>
          )}

          {isEmployee ? (
            <NavLink href={employeeProfileHref} icon={Users}>My Profile</NavLink>
          ) : (
            <>
              <NavLink href="/employees" icon={Users}>Employees</NavLink>
              <NavLink href="/contracts" icon={FileText}>Contracts</NavLink>
            </>
          )}

          <NavLink href="/attendance" icon={Clock}>Attendance</NavLink>

          <div className="px-3 pt-4 pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Time Off</p>
          </div>
          {!isEmployee ? (
            <>
              <NavLink href="/time-off/requests" icon={CalendarClock} nested>Requests</NavLink>
              <NavLink href="/time-off/allocations" icon={CalendarRange} nested>Allocations</NavLink>
              <NavLink href="/time-off/types" icon={Settings2} nested>Types</NavLink>
            </>
          ) : (
            <NavLink href="/time-off/requests" icon={CalendarClock} nested>My Requests</NavLink>
          )}

          {/* Payroll section - hidden entirely for HR Manager, per role permissions */}
          {!isHRManagerOnly && (
            <>
              <div className="px-3 pt-4 pb-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Payroll</p>
              </div>
              {!isEmployee ? (
                <>
                  <NavLink href="/payroll/payruns" icon={Wallet} nested>Payruns</NavLink>
                  <NavLink href="/payroll/payslips" icon={Receipt} nested>Payslips</NavLink>
                  <NavLink href="/payroll/structures" icon={ListChecks} nested>Structures</NavLink>
                  <NavLink href="/payroll/rules" icon={SlidersHorizontal} nested>Rules</NavLink>
                </>
              ) : (
                <NavLink href="/payroll/payslips" icon={Receipt} nested>My Payslips</NavLink>
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
