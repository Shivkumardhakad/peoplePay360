"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowRight, Loader2, LayoutList, Kanban, DollarSign, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MOCK_PAYRUNS = [
  {
    id: "PR-2023-10",
    name: "October 2023 Payroll",
    periodStart: "2023-10-01",
    periodEnd: "2023-10-31",
    structure: "Standard Tech Package",
    employees: 124,
    netTotal: 460000,
    status: "PAID" as const,
  },
  {
    id: "PR-2023-11",
    name: "November 2023 Payroll",
    periodStart: "2023-11-01",
    periodEnd: "2023-11-30",
    structure: "Standard Tech Package",
    employees: 126,
    netTotal: 0,
    status: "DRAFT" as const,
  },
];

export default function PayrunsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [openingId, setOpeningId] = useState<string | null>(null);

  const filteredPayruns = MOCK_PAYRUNS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.structure.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenBatch = (id: string) => {
    setOpeningId(id);
    router.push(`/payroll/payruns/${id}`);
  };

  const draftPayruns = filteredPayruns.filter((p) => p.status === "DRAFT");
  const paidPayruns = filteredPayruns.filter((p) => p.status === "PAID");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Payruns</h1>
          <p className="text-xs text-muted-foreground">Manage payroll processing batches and lifecycle states.</p>
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

          <Link href="/payroll/payruns/new">
            <Button size="sm" className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              Create Payrun
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter payrun batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredPayruns.length} batches
        </span>
      </div>

      {/* Content View */}
      {viewMode === "list" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Batch Ref</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Salary Structure</TableHead>
                <TableHead className="text-right">Employees</TableHead>
                <TableHead className="text-right">Net Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[90px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayruns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-xs text-muted-foreground">
                    No payrun batches found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayruns.map((payrun) => {
                  const isOpening = openingId === payrun.id;

                  return (
                    <TableRow key={payrun.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{payrun.id}</TableCell>
                      <TableCell className="font-medium text-xs">
                        <Link href={`/payroll/payruns/${payrun.id}`} className="hover:underline">
                          {payrun.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {payrun.periodStart} → {payrun.periodEnd}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{payrun.structure}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{payrun.employees}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        ${payrun.netTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            payrun.status === "PAID"
                              ? "success"
                              : payrun.status === "DRAFT"
                              ? "secondary"
                              : "default"
                          }
                          className="text-[10px] font-mono"
                        >
                          {payrun.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right p-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenBatch(payrun.id)}
                          disabled={isOpening}
                          className="h-6 px-2 text-[11px] gap-1"
                        >
                          {isOpening ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3 h-3" />
                          )}
                          <span>{isOpening ? "Opening..." : "View"}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Draft Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Draft & Setup ({draftPayruns.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {draftPayruns.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No draft batches.
                </div>
              ) : (
                draftPayruns.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-lg border border-border/80 bg-card hover:border-amber-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground font-mono">{p.id}</h4>
                        <p className="text-xs font-medium text-foreground mt-0.5">{p.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                        {p.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1 font-mono">
                        <Users className="w-3 h-3 text-muted-foreground" /> {p.employees} Employees
                      </span>
                      <span className="flex items-center gap-1 font-mono justify-end font-semibold text-foreground">
                        <DollarSign className="w-3 h-3 text-muted-foreground" /> ${p.netTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {p.periodStart} → {p.periodEnd}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBatch(p.id)}
                        className="h-6 text-[10px] gap-1"
                      >
                        Compute <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Paid Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Finalized & Paid ({paidPayruns.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {paidPayruns.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No finalized batches.
                </div>
              ) : (
                paidPayruns.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-lg border border-border/80 bg-card hover:border-emerald-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-foreground font-mono">{p.id}</h4>
                        <p className="text-xs font-medium text-foreground mt-0.5">{p.name}</p>
                      </div>
                      <Badge variant="success" className="text-[10px] font-mono shrink-0">
                        {p.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1 font-mono">
                        <Users className="w-3 h-3 text-emerald-600" /> {p.employees} Employees
                      </span>
                      <span className="flex items-center gap-1 font-mono justify-end font-semibold text-emerald-600">
                        ${p.netTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {p.periodStart} → {p.periodEnd}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBatch(p.id)}
                        className="h-6 text-[10px] gap-1"
                      >
                        View Payslips <ArrowRight className="w-3 h-3" />
                      </Button>
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

