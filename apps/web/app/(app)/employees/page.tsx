"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeForm, type EmployeeFormValues } from "@/components/employee-form";
import { Plus, Search, Users, ArrowUpRight, List, LayoutGrid, Building2, Briefcase, UserCheck, Clock, UserX } from "lucide-react";
import { getEmployeesAction } from "@/lib/api-actions";

interface EmployeeItem {
  id: string;
  name: string;
  department: string;
  position: string;
  status: "Active" | "Inactive" | "On Leave";
}

const KANBAN_COLUMNS: { status: EmployeeItem["status"]; title: string; icon: any; color: string; badgeVariant: "success" | "warning" | "secondary" }[] = [
  { status: "Active", title: "Active Employees", icon: UserCheck, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500", badgeVariant: "success" },
  { status: "On Leave", title: "On Leave", icon: Clock, color: "border-amber-500/20 bg-amber-500/5 text-amber-500", badgeVariant: "warning" },
  { status: "Inactive", title: "Inactive / Former", icon: UserX, color: "border-slate-500/20 bg-slate-500/5 text-slate-500", badgeVariant: "secondary" },
];

export default function EmployeesPage() {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  useEffect(() => { getEmployeesAction().then((rows) => setEmployees(rows.map((row) => ({ ...row, status: row.status === "ACTIVE" ? "Active" : row.status === "ON_LEAVE" ? "On Leave" : "Inactive" })))); }, []);

  const role = session?.user?.role;
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

  const handleCreated = async (_data: EmployeeFormValues) => {
    const rows = await getEmployeesAction();
    setEmployees(rows.map((row) => ({ ...row, status: row.status === "ACTIVE" ? "Active" : row.status === "ON_LEAVE" ? "On Leave" : "Inactive" })));
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

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
            {filteredEmployees.length} of {employees.length} employees
          </span>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-md border border-border bg-muted/40">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-6 w-6 rounded-sm text-xs"
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="icon"
              className="h-6 w-6 rounded-sm text-xs"
              onClick={() => setViewMode("kanban")}
              title="Kanban View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content area: List vs Kanban */}
      {viewMode === "list" ? (
        /* Compact Table */
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
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
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const columnEmployees = filteredEmployees.filter((e) => e.status === col.status);
            const Icon = col.icon;
            return (
              <div key={col.status} className="flex flex-col rounded-lg border border-border bg-card p-3 space-y-3 min-h-[300px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${col.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{col.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {columnEmployees.length}
                  </Badge>
                </div>

                {/* Column Cards */}
                <div className="space-y-2.5 flex-1">
                  {columnEmployees.length === 0 ? (
                    <div className="h-24 rounded border border-dashed border-border flex items-center justify-center text-[11px] text-muted-foreground">
                      No employees
                    </div>
                  ) : (
                    columnEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="p-3 rounded-md border border-border bg-background hover:border-primary/40 transition-all shadow-sm space-y-2 group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/employees/${emp.id}`}
                              className="text-xs font-medium text-foreground hover:text-primary transition-colors block"
                            >
                              {emp.name}
                            </Link>
                            <span className="text-[10px] font-mono text-muted-foreground">{emp.id}</span>
                          </div>
                          <Link
                            href={`/employees/${emp.id}`}
                            className="p-1 rounded text-muted-foreground hover:text-foreground opacity-70 group-hover:opacity-100 transition-opacity"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                          <div className="flex items-center gap-1.5 truncate">
                            <Briefcase className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{emp.position}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <Building2 className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{emp.department}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Badge variant={col.badgeVariant} className="text-[10px] font-mono">
                            {emp.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
