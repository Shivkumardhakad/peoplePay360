"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, ShieldCheck } from "lucide-react";

type UserRole = "ADMIN" | "HR_MANAGER" | "HR_PAYROLL_USER" | "HR_PAYROLL_MANAGER" | "EMPLOYEE";

const MOCK_USERS = [
  { id: "USR-001", name: "Admin User", email: "admin@peoplepay360.local", role: "ADMIN" as UserRole, status: "Active" },
  { id: "USR-002", name: "Bob Smith", email: "hr.manager@peoplepay360.local", role: "HR_MANAGER" as UserRole, status: "Active" },
  { id: "USR-003", name: "Alice Johnson", email: "payroll.manager@peoplepay360.local", role: "HR_PAYROLL_MANAGER" as UserRole, status: "Active" },
  { id: "USR-004", name: "Charlie Davis", email: "payroll.user@peoplepay360.local", role: "HR_PAYROLL_USER" as UserRole, status: "Active" },
  { id: "USR-005", name: "Emily Watson", email: "employee@peoplepay360.local", role: "EMPLOYEE" as UserRole, status: "Active" },
];

function formatRoleLabel(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "HR_MANAGER":
      return "HR Manager";
    case "HR_PAYROLL_MANAGER":
      return "Payroll Manager";
    case "HR_PAYROLL_USER":
      return "Payroll User";
    case "EMPLOYEE":
      return "Employee";
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("HR_MANAGER");
  const [password, setPassword] = useState("");

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      name,
      email,
      role,
      status: "Active",
    };

    setUsers([...users, newUser]);
    setName("");
    setEmail("");
    setPassword("");
    setRole("HR_MANAGER");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight">Team & Roles</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Manage system access and assign user roles.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="pp-solid-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create System User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sarah@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Assigned Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="HR_MANAGER">HR_MANAGER</option>
                  <option value="HR_PAYROLL_MANAGER">HR_PAYROLL_MANAGER</option>
                  <option value="HR_PAYROLL_USER">HR_PAYROLL_USER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Create User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar as glass */}
      <div className="p-4 pp-glass flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or role..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/80 font-mono text-sm" 
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredUsers.length}</span> user records
        </div>
      </div>

      {/* Solid Surface Table */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead className="w-[100px]">User ID</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/50 border-b border-border/60">
                <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                <TableCell className="font-mono text-xs">{u.email}</TableCell>
                <TableCell>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {u.role}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-success/10 text-success">
                    {u.status}
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
