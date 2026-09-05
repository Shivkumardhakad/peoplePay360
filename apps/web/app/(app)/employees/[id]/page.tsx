import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CalendarDays, ArrowLeft } from "lucide-react";
import { EmployeeForm } from "@/components/employee-form";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Mock data fetching based on ID
  const { id: employeeId } = await params;
  const mockEmployee = {
    id: employeeId,
    firstName: "Alice",
    lastName: "Johnson",
    email: "alice@example.com",
    department: "Engineering",
    status: "ACTIVE" as const,
    dateOfJoining: "2023-01-15",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {mockEmployee.firstName} {mockEmployee.lastName}
            </h1>
            <span className="font-mono text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md">
              {mockEmployee.id}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{mockEmployee.department} • {mockEmployee.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Smart Links */}
        <Link href={`/contracts?employeeId=${employeeId}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Contracts</p>
                  <p className="text-xs text-muted-foreground">Active & Historical</p>
                </div>
              </div>
              <span className="font-mono text-sm font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded">2</span>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/attendance?employeeId=${employeeId}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Attendance</p>
                  <p className="text-xs text-muted-foreground">Timesheets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/time-off/requests?employeeId=${employeeId}`}>
          <Card className="hover:border-primary transition-colors cursor-pointer group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Time Off</p>
                  <p className="text-xs text-muted-foreground">Leave requests</p>
                </div>
              </div>
              <span className="font-mono text-sm font-medium bg-muted text-muted-foreground px-2 py-1 rounded">5</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeForm defaultValues={mockEmployee} />
        </CardContent>
      </Card>
    </div>
  );
}
