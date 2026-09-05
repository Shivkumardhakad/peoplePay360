"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    status: "PAID",
  },
  {
    id: "PR-2023-11",
    name: "November 2023 Payroll",
    periodStart: "2023-11-01",
    periodEnd: "2023-11-30",
    structure: "Standard Tech Package",
    employees: 126,
    netTotal: 0,
    status: "DRAFT",
  },
];

function statusClass(status: string) {
  if (status === "PAID") return "bg-success/10 text-success";
  if (status === "DRAFT") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary";
}

export default function PayrunsPage() {
  const [search, setSearch] = useState("");

  const filteredPayruns = MOCK_PAYRUNS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.structure.toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payruns</h1>
          <p className="text-sm text-muted-foreground">Manage payroll processing batches and lifecycle states.</p>
        </div>
        <Link href="/payroll/payruns/new">
          <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            Create Payrun
          </Button>
        </Link>
      </div>

      {/* Glass Filter Bar */}
      <div className="p-4 pp-glass flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search payruns..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/80" 
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredPayruns.length}</span> payruns
        </div>
      </div>

      {/* Solid Surface Table */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead>Payrun Ref</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Salary Structure</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Net Total</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayruns.map((payrun) => (
              <TableRow key={payrun.id} className="hover:bg-muted/50 border-b border-border/60">
                <TableCell className="font-mono text-xs text-muted-foreground">{payrun.id}</TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/payroll/payruns/${payrun.id}`} className="hover:underline">
                    {payrun.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {payrun.periodStart} to {payrun.periodEnd}
                </TableCell>
                <TableCell>{payrun.structure}</TableCell>
                <TableCell className="text-right font-mono text-xs">{payrun.employees}</TableCell>
                <TableCell className="text-right font-mono text-xs font-medium">
                  ${payrun.netTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(payrun.status)}`}>
                    {payrun.status}
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
