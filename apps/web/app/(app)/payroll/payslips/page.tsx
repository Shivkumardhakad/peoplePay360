"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const MOCK_PAYSLIPS = [
  {
    id: "PS-1001",
    employee: "Alice Johnson",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    gross: 10000,
    deductions: 2500,
    net: 7500,
    status: "PAID",
  },
  {
    id: "PS-1002",
    employee: "Bob Smith",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    gross: 7916.67,
    deductions: 1800,
    net: 6116.67,
    status: "PAID",
  },
  {
    id: "PS-1101",
    employee: "Alice Johnson",
    period: "2023-11",
    payrun: "November 2023 Payroll",
    gross: 0,
    deductions: 0,
    net: 0,
    status: "DRAFT",
  },
];

function money(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export default function PayslipsPage() {
  const [search, setSearch] = useState("");

  const filteredPayslips = MOCK_PAYSLIPS.filter(p =>
    p.employee.toLowerCase().includes(search.toLowerCase()) ||
    p.payrun.toLowerCase().includes(search.toLowerCase()) ||
    p.period.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payslips</h1>
          <p className="text-sm text-muted-foreground">Generated employee salary statements ready for review and delivery.</p>
        </div>
      </div>

      {/* Glass Filter Bar */}
      <div className="p-4 pp-glass flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search payslips..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/80" 
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredPayslips.length}</span> payslips
        </div>
      </div>

      {/* Solid Surface Table */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead>Payslip Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Payrun Batch</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right font-bold">Net Salary</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayslips.map((payslip) => (
              <TableRow key={payslip.id} className="hover:bg-muted/50 border-b border-border/60">
                <TableCell className="font-mono text-xs text-muted-foreground">{payslip.id}</TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/payroll/payslips/${payslip.id}`} className="hover:underline">
                    {payslip.employee}
                  </Link>
                </TableCell>
                <TableCell>{payslip.payrun}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{payslip.period}</TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">{money(payslip.gross)}</TableCell>
                <TableCell className="text-right font-mono text-xs text-destructive">-{money(payslip.deductions)}</TableCell>
                <TableCell className="text-right font-mono text-xs font-bold text-accent">{money(payslip.net)}</TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    payslip.status === "PAID" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {payslip.status}
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
