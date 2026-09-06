"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { Plus, Search, ShieldCheck, Loader2, KeyRound, LayoutList, Kanban, Mail, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getUsersAction,
  createUserAction,
  resetUserPasswordAction,
  type SystemUserRole,
} from "@/lib/api-actions";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: SystemUserRole;
  employeeId?: string | null;
  createdAt?: string | Date;
};

function formatRoleLabel(role: SystemUserRole) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "HR_MANAGER":
      return "HR Manager";
    case "PAYROLL_MANAGER":
      return "Payroll Manager";
    case "HR_PAYROLL_USER":
      return "Payroll User";
    case "EMPLOYEE":
      return "Employee";
    default:
      return role;
  }
}

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [kanbanPages, setKanbanPages] = useState<{ [key: string]: number }>({});

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SystemUserRole>("HR_MANAGER");
  const [password, setPassword] = useState("");

  const loadUsers = async () => {
    try {
      const res = await getUsersAction();
      if (res.success && res.users) {
        setUsers(
          res.users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role as SystemUserRole,
            employeeId: u.employeeId,
            createdAt: u.createdAt,
          }))
        );
      }
    } catch {
      setError("Unable to load users from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term)
    );
  }, [search, users]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    setKanbanPages({});
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    setActionLoadingId(userId);
    try {
      const res = await resetUserPasswordAction(userId);
      if (res.success) {
        toast({
          title: "Password Reset Success",
          description: `Temporary password for ${userName} set to: ${res.temporaryPassword}`,
          type: "success",
        });
      } else {
        toast({
          title: "Password Reset Failed",
          description: res.error || "Unable to reset password.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reset password.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      setError("Please fill out all required fields.");
      return;
    }

    if (cleanPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createUserAction({
        name: cleanName,
        email: cleanEmail,
        role,
        password: cleanPassword,
      });

      if (!res.success || !res.user) {
        setError(res.error || "Failed to create user");
        setSubmitting(false);
        toast({
          title: "User Creation Failed",
          description: res.error || "Could not save user to the database.",
          type: "error",
        });
        return;
      }

      toast({
        title: "User Created",
        description: `Created system account for ${cleanName} (${role}).`,
        type: "success",
      });

      setDialogOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("HR_MANAGER");
      await loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error creating user");
    } finally {
      setSubmitting(false);
    }
  };

  const adminUsers = filteredUsers.filter((u) => u.role === "ADMIN");
  const hrManagerUsers = filteredUsers.filter((u) => u.role === "HR_MANAGER");
  const payrollMgrUsers = filteredUsers.filter((u) => u.role === "PAYROLL_MANAGER");
  const payrollUserUsers = filteredUsers.filter((u) => u.role === "HR_PAYROLL_USER");
  const employeeUsers = filteredUsers.filter((u) => u.role === "EMPLOYEE");

  const kanbanRoleCols = [
    { roleKey: "ADMIN", title: "Admin", users: adminUsers, dotColor: "bg-violet-500", hoverColor: "hover:border-violet-500/40", badgeRole: "ADMIN" },
    { roleKey: "HR_MANAGER", title: "HR Mgr", users: hrManagerUsers, dotColor: "bg-sky-500", hoverColor: "hover:border-sky-500/40", badgeRole: "HR MGR" },
    { roleKey: "PAYROLL_MANAGER", title: "Payroll Mgr", users: payrollMgrUsers, dotColor: "bg-emerald-500", hoverColor: "hover:border-emerald-500/40", badgeRole: "PAYROLL MGR" },
    { roleKey: "HR_PAYROLL_USER", title: "Payroll Asst", users: payrollUserUsers, dotColor: "bg-amber-500", hoverColor: "hover:border-amber-500/40", badgeRole: "ASST" },
    { roleKey: "EMPLOYEE", title: "Employees", users: employeeUsers, dotColor: "bg-slate-400", hoverColor: "hover:border-border", badgeRole: "EMP" },
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">User Management</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            System accounts, security credentials, and role-based access control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="w-3.5 h-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("kanban")}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create System User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 pt-2">
                {error && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    {error}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-medium">Assigned Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as SystemUserRole)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="HR_MANAGER">HR_MANAGER (People, Contracts, Time-off)</option>
                    <option value="PAYROLL_MANAGER">PAYROLL_MANAGER (Payroll & Ledger)</option>
                    <option value="HR_PAYROLL_USER">HR_PAYROLL_USER (Payroll & Time-off Assistant)</option>
                    <option value="EMPLOYEE">EMPLOYEE (Self-Service Portal)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium">Temporary Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-mono text-xs"
                    minLength={8}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 h-8">
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {submitting ? "Creating User..." : "Create User"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          <span className="text-[11px] font-mono text-muted-foreground">
            {filteredUsers.length} users
          </span>
        </div>
      </div>

      {/* Content View */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Loading users...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((u) => {
                    const isResetting = actionLoadingId === u.id;

                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium text-xs">{u.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {formatRoleLabel(u.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="success" className="text-[10px] font-mono">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetPassword(u.id, u.name)}
                            disabled={isResetting}
                            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                            title="Reset user password"
                          >
                            {isResetting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <KeyRound className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span>{isResetting ? "Resetting..." : "Reset PW"}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {kanbanRoleCols.map((col) => {
            const colPage = kanbanPages[col.roleKey] || 1;
            const colTotalPages = Math.ceil(col.users.length / pageSize);
            const paginatedColUsers = col.users.slice((colPage - 1) * pageSize, colPage * pageSize);

            return (
              <div key={col.roleKey} className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {col.title} ({col.users.length})
                    </h3>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {paginatedColUsers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                      No users
                    </div>
                  ) : (
                    paginatedColUsers.map((u) => (
                      <div key={u.id} className={`p-3 rounded-lg border border-border/80 bg-card ${col.hoverColor} transition-all space-y-2`}>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1 truncate">
                            {col.roleKey === "ADMIN" && <UserCheck className="w-3.5 h-3.5 text-violet-500 shrink-0" />}
                            <span className="truncate">{u.name}</span>
                          </h4>
                          <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                            {col.badgeRole}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 shrink-0" /> {u.email}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {colTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
                    <span>Page {colPage} of {colTotalPages}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="iconSm"
                        className="h-6 w-6"
                        disabled={colPage <= 1}
                        onClick={() => setKanbanPages((prev) => ({ ...prev, [col.roleKey]: colPage - 1 }))}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="iconSm"
                        className="h-6 w-6"
                        disabled={colPage >= colTotalPages}
                        onClick={() => setKanbanPages((prev) => ({ ...prev, [col.roleKey]: colPage + 1 }))}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
