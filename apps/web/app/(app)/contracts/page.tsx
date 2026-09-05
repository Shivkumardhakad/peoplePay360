"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, LayoutList, Kanban, FileText, Calendar, Building2 } from "lucide-react";
import { ContractForm } from "@/components/contract-form";
import { getContractsAction } from "@/lib/api-actions";

interface ContractItem {
  id: string;
  employee: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  wage: number;
  status: "Active" | "Ended";
}

export default function ContractsPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getContractsAction().then((liveContracts) => {
      setContracts(liveContracts);
    });
  }, []);

  const role = String(session?.user?.role || "ADMIN");
  const canCreateContract =
    role === "ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER" ||
    role === "HR_PAYROLL_USER";

  const filteredContracts = contracts.filter(
    (c) =>
      c.employee.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = async () => {
    const live = await getContractsAction();
    setContracts(live);
    setDialogOpen(false);
  };

  const activeContracts = filteredContracts.filter((c) => c.status === "Active");
  const endedContracts = filteredContracts.filter((c) => c.status === "Ended");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Contracts</h1>
          <p className="text-xs text-muted-foreground">Employment terms, compensation, and active ledger ties.</p>
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

          {canCreateContract && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" />
                  Create Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New Employment Contract</DialogTitle>
                </DialogHeader>
                <ContractForm onSuccess={handleCreated} onCancel={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredContracts.length} records
        </span>
      </div>

      {/* Content View */}
      {viewMode === "list" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Term</TableHead>
                <TableHead className="text-right">Base Wage</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                    No contracts found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium text-xs">{contract.employee}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{contract.position}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{contract.department}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {contract.startDate} → {contract.endDate}
                    </TableCell>
                    <TableCell className="font-mono text-right text-xs font-semibold">
                      ${contract.wage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={contract.status === "Active" ? "success" : "secondary"}
                        className="text-[10px] font-mono"
                      >
                        {contract.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Active Contracts ({activeContracts.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {activeContracts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No active contracts.
                </div>
              ) : (
                activeContracts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-lg border border-border/80 bg-card hover:border-emerald-500/40 hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">{c.employee}</h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3" /> {c.position}
                        </p>
                      </div>
                      <Badge variant="success" className="text-[10px] font-mono shrink-0">
                        {c.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {c.department}
                      </span>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        ${c.wage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {c.startDate} → {c.endDate}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ended Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Ended / Terminated ({endedContracts.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {endedContracts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No ended contracts.
                </div>
              ) : (
                endedContracts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-lg border border-border/80 bg-card hover:border-border transition-all space-y-2.5 opacity-85"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">{c.employee}</h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3" /> {c.position}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                        {c.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {c.department}
                      </span>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        ${c.wage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {c.startDate} → {c.endDate}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

