import Link from "next/link";
import { 
  Users, 
  FileText, 
  Clock, 
  LayoutDashboard,
  UserCheck,
  CalendarDays,
  CreditCard,
  Settings,
  Shield,
} from "lucide-react";

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

export function AppSidebar({ session = MOCK_SESSION }: { session?: Session }) {
  const role = session.user.role;
  const isEmployee = role === "EMPLOYEE";
  const isHRManagerOnly = role === "HR_MANAGER";
  const isAdmin = role === "ADMIN";
  const employeeProfileHref = session.user.employeeId ? `/employees/${session.user.employeeId}` : "/employees";

  return (
    <div className="w-64 bg-primary text-primary-foreground min-h-screen flex flex-col border-r border-border/20 pp-glass-dark">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight">PeoplePay360</h1>
        <p className="text-xs text-primary-foreground/60 font-mono mt-0.5">Payroll & HR Ledger</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {!isEmployee && (
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        )}

        {/* Admin Only Section: Users Management */}
        {isAdmin && (
          <Link href="/users" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors">
            <Shield className="w-4 h-4 text-accent" />
            <span>Team & Roles</span>
          </Link>
        )}
        
        {isEmployee ? (
          <Link href={employeeProfileHref} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors">
            <Users className="w-4 h-4" />
            <span>My Profile</span>
          </Link>
        ) : (
          <>
            <Link href="/employees" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors">
              <Users className="w-4 h-4" />
              <span>Employees</span>
            </Link>
            <Link href="/contracts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors">
              <FileText className="w-4 h-4" />
              <span>Contracts</span>
            </Link>
          </>
        )}

        <Link href="/attendance" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors">
          <Clock className="w-4 h-4" />
          <span>Attendance</span>
        </Link>

        {/* Time Off */}
        <div className="pt-4 pb-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-primary-foreground/50">Time Off</p>
        </div>
        {!isEmployee ? (
          <>
            <Link href="/time-off/requests" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
              <span>Requests</span>
            </Link>
            <Link href="/time-off/allocations" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
              <span>Allocations</span>
            </Link>
            <Link href="/time-off/types" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
              <span>Types</span>
            </Link>
          </>
        ) : (
          <Link href="/time-off/requests" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
            <span>My Requests</span>
          </Link>
        )}

        {/* Payroll Section - Hidden completely for HR_MANAGER per Section 5a */}
        {!isHRManagerOnly && (
          <>
            <div className="pt-4 pb-1">
              <p className="px-3 text-[11px] font-semibold tracking-wider uppercase text-primary-foreground/50">Payroll</p>
            </div>
            {!isEmployee ? (
              <>
                <Link href="/payroll/payruns" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
                  <span>Payruns</span>
                </Link>
                <Link href="/payroll/payslips" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
                  <span>Payslips</span>
                </Link>
                <Link href="/payroll/structures" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
                  <span>Structures</span>
                </Link>
                <Link href="/payroll/rules" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
                  <span>Rules</span>
                </Link>
              </>
            ) : (
              <Link href="/payroll/payslips" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-primary-foreground/10 transition-colors pl-8">
                <span>My Payslips</span>
              </Link>
            )}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-primary-foreground/10 text-xs font-mono text-primary-foreground/50">
        PeoplePay360 v1.0
      </div>
    </div>
  );
}
