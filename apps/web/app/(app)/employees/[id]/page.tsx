import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CalendarDays, ArrowLeft, ReceiptText } from "lucide-react";
import { EmployeeForm } from "@/components/employee-form";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: employeeId } = await params;
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role || "ADMIN";
  const isEmployee = userRole === "EMPLOYEE";
  const userEmpId = session?.user?.employeeId || "EMP-004";

  // If Employee, strictly enforce viewing ONLY their own profile
  if (isEmployee && employeeId !== userEmpId) {
    redirect(`/employees/${userEmpId}`);
  }

  const employeeName = isEmployee ? (session?.user?.name || "Emily Watson") : "Alice Johnson";
  const nameParts = employeeName.split(" ");
  const firstName = nameParts[0] || "Alice";
  const lastName = nameParts.slice(1).join(" ") || "Johnson";

  const mockEmployee = {
    id: isEmployee ? userEmpId : employeeId,
    firstName: firstName,
    lastName: lastName,
    email: isEmployee ? (session?.user?.email || "emily.watson@company.com") : "alice.johnson@company.com",
    department: isEmployee ? "Product & Design" : "Engineering",
    status: "ACTIVE" as const,
    dateOfJoining: isEmployee ? "2023-03-01" : "2023-01-15",
  };

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        {!isEmployee && (
          <Link href="/employees">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              {mockEmployee.firstName} {mockEmployee.lastName}
            </h1>
            <span className="font-mono text-[11px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">
              {mockEmployee.id}
            </span>
            <Badge variant="success" className="text-[10px] font-mono">
              Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {mockEmployee.department} • Joined {mockEmployee.dateOfJoining}
          </p>
        </div>
      </div>

      {/* Related Hub Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {isEmployee ? (
          <Link href="/payroll/payslips">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-muted rounded">
                    <ReceiptText className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-xs text-foreground">My Payslips</p>
                    <p className="text-[11px] text-muted-foreground">Salary Statements</p>
                  </div>
                </div>
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">View</span>
              </div>
            </Card>
          </Link>
        ) : (
          <Link href={`/contracts?employeeId=${employeeId}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-muted rounded">
                    <FileText className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-xs text-foreground">Contracts</p>
                    <p className="text-[11px] text-muted-foreground">Compensation Terms</p>
                  </div>
                </div>
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">2</span>
              </div>
            </Card>
          </Link>
        )}

        <Link href={isEmployee ? "/attendance" : `/attendance?employeeId=${employeeId}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-muted rounded">
                  <Clock className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-xs text-foreground">Attendance</p>
                  <p className="text-[11px] text-muted-foreground">Timesheet Logs</p>
                </div>
              </div>
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">98%</span>
            </div>
          </Card>
        </Link>

        <Link href={isEmployee ? "/time-off/requests" : `/time-off/requests?employeeId=${employeeId}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-muted rounded">
                  <CalendarDays className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-xs text-foreground">Time Off</p>
                  <p className="text-[11px] text-muted-foreground">Leave Requests</p>
                </div>
              </div>
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">15d</span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
            Employee Profile & Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <EmployeeForm defaultValues={mockEmployee} readOnly={isEmployee} />
        </CardContent>
      </Card>
    </div>
  );
}
