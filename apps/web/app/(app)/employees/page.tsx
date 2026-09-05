import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";

const MOCK_EMPLOYEES = [
  { id: "EMP-001", name: "Alice Johnson", department: "Engineering", position: "Senior Frontend Engineer", status: "Active" },
  { id: "EMP-002", name: "Bob Smith", department: "HR", position: "HR Manager", status: "Active" },
  { id: "EMP-003", name: "Charlie Davis", department: "Finance", position: "Payroll Specialist", status: "On Leave" },
];

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage employee records and profiles.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search employees..." className="pl-9" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_EMPLOYEES.map((employee) => (
              <TableRow key={employee.id} className="cursor-pointer hover:bg-muted/50">
                {/* Notice the font-mono applied to the employee ID as requested */}
                <TableCell className="font-mono text-xs">{employee.id}</TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/employees/${employee.id}`} className="hover:underline">
                    {employee.name}
                  </Link>
                </TableCell>
                <TableCell>{employee.department}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    employee.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {employee.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
