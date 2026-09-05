"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeForm, type EmployeeFormValues } from "@/components/employee-form";
import { Plus, Search, Users, ArrowUpRight } from "lucide-react";

interface EmployeeItem {
  id: string;
  name: string;
  department: string;
  position: string;
  status: "Active" | "Inactive" | "On Leave";
}

const INITIAL_EMPLOYEES: EmployeeItem[] = [
  { id: "EMP-001", name: "Alice Johnson", department: "Engineering", position: "Senior Frontend Engineer", status: "Active" },
  { id: "EMP-002", name: "Bob Smith", department: "Human Resources", position: "HR Manager", status: "Active" },
  { id: "EMP-003", name: "Charlie Davis", department: "Finance & Accounting", position: "Payroll Specialist", status: "On Leave" },
  { id: "EMP-004", name: "Emily Watson", department: "Product & Design", position: "Lead UX Designer", status: "Active" },
];

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<EmployeeItem[]>(INITIAL_EMPLOYEES);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const role = session?.user?.role || "ADMIN";
  const canAddEmployee =
    role === "ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER" ||
    role === "HR_PAYROLL_USER";

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = (data: EmployeeFormValues) => {
    const newEmp: EmployeeItem = {
      id: `EMP-${String(employees.length + 1).padStart(3, "0")}`,
      name: `${data.firstName} ${data.lastName}`,
      department: data.department,
      position: "New Hire",
      status: data.status === "ACTIVE" ? "Active" : data.status === "ON_LEAVE" ? "On Leave" : "Inactive",
    };
    setEmployees([newEmp, ...employees]);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Employees</h1>
          <p className="text-xs text-muted-foreground">Directory and employment contracts.</p>
        </div>

        {canAddEmployee && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <EmployeeForm onSuccess={handleCreated} onCancel={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredEmployees.length} of {employees.length} employees
        </span>
      </div>

      {/* Compact Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{employee.id}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/employees/${employee.id}`} className="hover:underline">
                      {employee.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{employee.department}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{employee.position}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        employee.status === "Active"
                          ? "success"
                          : employee.status === "On Leave"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px] font-mono"
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-1">
                    <Link
                      href={`/employees/${employee.id}`}
                      className="inline-flex p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
