"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShieldCheck, Loader2, KeyRound, LayoutList, Kanban, Mail, UserCheck } from "lucide-react";
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

const INITIAL_USERS: SystemUser[] = [
  { id: "USR-001", name: "Admin User", email: "admin@peoplepay360.local", role: "ADMIN" },
  { id: "USR-002", name: "Bob Smith", email: "hr.manager@peoplepay360.local", role: "HR_MANAGER" },
  { id: "USR-003", name: "Alice Johnson", email: "payroll.manager@peoplepay360.local", role: "PAYROLL_MANAGER" },
  { id: "USR-004", name: "Emily Watson", email: "employee@peoplepay360.local", role: "EMPLOYEE" },
];

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
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SystemUserRole>("HR_MANAGER");
  const [password, setPassword] = useState("");

  const loadUsers = async () => {
    try {
      const res = await getUsersAction();
      if (res.success && res.users && res.users.length > 0) {
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
      // Keep initial users on network failure
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

      const createdUser: SystemUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        role: res.user.role as SystemUserRole,
        employeeId: res.user.employeeId,
        createdAt: res.user.createdAt,
      };

      setUsers((current) => [createdUser, ...current]);
      toast({
        title: "User Created Successfully",
        description: `${createdUser.name} (${createdUser.email}) can now log in immediately.`,
        type: "success",
      });

      setName("");
      setEmail("");
      setPassword("");
      setRole("HR_MANAGER");
      setDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      toast({
        title: "System Error",
        description: msg,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const adminUsers = filteredUsers.filter((u) => u.role === "ADMIN");
  const hrManagerUsers = filteredUsers.filter((u) => u.role === "HR_MANAGER");
  const payrollMgrUsers = filteredUsers.filter((u) => u.role === "PAYROLL_MANAGER");
  const payrollUserUsers = filteredUsers.filter((u) => u.role === "HR_PAYROLL_USER");
  const employeeUsers = filteredUsers.filter((u) => u.role === "EMPLOYEE");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">Team & Roles</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Administer user accounts, security profiles, and role-based access permissions.
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
            onChange={(e) => setSearch(e.target.value)}
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
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[110px]">User ID</TableHead>
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
                  <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const isResetting = actionLoadingId === u.id;

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground truncate max-w-[110px]">{u.id}</TableCell>
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
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {/* Admin Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Admin ({adminUsers.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {adminUsers.map((u) => (
                <div key={u.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-violet-500/40 transition-all space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-violet-500" /> {u.name}
                    </h4>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                      ADMIN
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {u.email}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* HR Manager Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  HR Mgr ({hrManagerUsers.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {hrManagerUsers.map((u) => (
                <div key={u.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-sky-500/40 transition-all space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-semibold text-foreground">{u.name}</h4>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                      HR MGR
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {u.email}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payroll Manager Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Payroll Mgr ({payrollMgrUsers.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {payrollMgrUsers.map((u) => (
                <div key={u.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-emerald-500/40 transition-all space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-semibold text-foreground">{u.name}</h4>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                      PAYROLL MGR
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {u.email}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payroll User Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Payroll Asst ({payrollUserUsers.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {payrollUserUsers.map((u) => (
                <div key={u.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-amber-500/40 transition-all space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-semibold text-foreground">{u.name}</h4>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                      ASST
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {u.email}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Employees ({employeeUsers.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {employeeUsers.slice(0, 15).map((u) => (
                <div key={u.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-border transition-all space-y-2 opacity-90">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs font-semibold text-foreground truncate">{u.name}</h4>
                    <Badge variant="secondary" className="text-[9px] font-mono shrink-0">
                      EMP
                    </Badge>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {u.email}
                  </p>
                </div>
              ))}
              {employeeUsers.length > 15 && (
                <p className="text-[11px] font-mono text-center text-muted-foreground pt-1">
                  + {employeeUsers.length - 15} more employees
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
