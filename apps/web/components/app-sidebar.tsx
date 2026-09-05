import Link from "next/link";
import {
  Users,
  FileText,
  Clock,
  LayoutDashboard,
  CalendarClock,
  Wallet,
  ListChecks,
  CalendarRange,
  Settings2,
  Receipt,
  SlidersHorizontal,
  Shield,
} from "lucide-react";

// Mock session type for UI building
export type Session = {
  user: {
    id: string;
    name: string;
    role: "ADMIN" | "HR_MANAGER" | "HR_PAYROLL_USER" | "HR_PAYROLL_MANAGER" | "EMPLOYEE";
    employeeId: string | null;
  }
};

export const MOCK_SESSION: Session = {
  user: {
    id: "1",
    name: "Admin User",
    role: "ADMIN",
    employeeId: null,
  }
};

function NavLink({
  href,
  icon: Icon,
  children,
  nested = false,
  accent = false,
}: {
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  nested?: boolean;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white ${
        nested ? "pl-9 text-[13px]" : "font-medium"
      }`}
    >
      {Icon && <Icon className={`h-4 w-4 shrink-0 ${accent ? "text-accent" : ""}`} />}
      <span>{children}</span>
    </Link>
  );
}

export function AppSidebar({ session = MOCK_SESSION }: { session?: Session }) {
  const role = session.user.role;
  const isEmployee = role === "EMPLOYEE";
  const isHRManagerOnly = role === "HR_MANAGER";
  const isAdmin = role === "ADMIN";
  const employeeProfileHref = session.user.employeeId ? `/employees/${session.user.employeeId}` : "/employees";

  return (
    <div className="p-4">
      <div className="pp-glass-dark flex h-[calc(100vh-2rem)] w-64 flex-col rounded-2xl">
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/90 text-sm font-bold text-primary-foreground">
            P
          </div>
          <h1 className="text-[15px] font-bold tracking-tight text-white">PeoplePay360</h1>
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

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] text-white/40">Payroll workspace</p>
        </div>
      </div>
    </div>
  );
}
