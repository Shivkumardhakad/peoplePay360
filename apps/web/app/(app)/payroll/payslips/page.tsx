"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Download, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { generatePayslipPDF } from "@/lib/payslip-pdf";

const MOCK_PAYSLIPS = [
  {
    id: "PS-1001",
    employeeName: "Alice Johnson",
    employeeId: "EMP-001",
    department: "Engineering",
    position: "Senior Frontend Engineer",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    contractRef: "CON-1001 (Standard Tech)",
    gross: 10000,
    deductions: 2500,
    net: 7500,
    status: "PAID" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 8000.0, type: "EARNING" as const },
      { rule: "Housing Allowance (HRA)", category: "ALLOWANCE", amount: 1500.0, type: "EARNING" as const },
      { rule: "Transport & Remote Allowance", category: "ALLOWANCE", amount: 500.0, type: "EARNING" as const },
      { rule: "Income Tax Withholding", category: "DEDUCTION", amount: -1800.0, type: "DEDUCTION" as const },
      { rule: "Retirement / Provident Fund", category: "DEDUCTION", amount: -400.0, type: "DEDUCTION" as const },
      { rule: "Health & Medical Insurance", category: "DEDUCTION", amount: -300.0, type: "DEDUCTION" as const },
    ],
  },
  {
    id: "PS-1002",
    employeeName: "Bob Smith",
    employeeId: "EMP-002",
    department: "Human Resources",
    position: "HR Manager",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    contractRef: "CON-1002 (HR Package)",
    gross: 7916.67,
    deductions: 1800,
    net: 6116.67,
    status: "PAID" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 6500.0, type: "EARNING" as const },
      { rule: "Housing Allowance", category: "ALLOWANCE", amount: 1416.67, type: "EARNING" as const },
      { rule: "Income Tax Withholding", category: "DEDUCTION", amount: -1400.0, type: "DEDUCTION" as const },
      { rule: "Provident Fund", category: "DEDUCTION", amount: -400.0, type: "DEDUCTION" as const },
    ],
  },
  {
    id: "PS-1101",
    employeeName: "Alice Johnson",
    employeeId: "EMP-001",
    department: "Engineering",
    position: "Senior Frontend Engineer",
    period: "2023-11",
    payrun: "November 2023 Payroll",
    contractRef: "CON-1001 (Standard Tech)",
    gross: 10000,
    deductions: 2500,
    net: 7500,
    status: "DRAFT" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 8000.0, type: "EARNING" as const },
      { rule: "Allowances", category: "ALLOWANCE", amount: 2000.0, type: "EARNING" as const },
      { rule: "Deductions", category: "DEDUCTION", amount: -2500.0, type: "DEDUCTION" as const },
    ],
  },
  {
    id: "PS-1004",
    employeeName: "Emily Watson",
    employeeId: "EMP-004",
    department: "Product & Design",
    position: "Lead UX Designer",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    contractRef: "CON-1004 (Design Lead)",
    gross: 8500,
    deductions: 1700,
    net: 6800,
    status: "PAID" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 7000.0, type: "EARNING" as const },
      { rule: "Creative Allowance", category: "ALLOWANCE", amount: 1500.0, type: "EARNING" as const },
      { rule: "Income Tax", category: "DEDUCTION", amount: -1300.0, type: "DEDUCTION" as const },
      { rule: "Provident Fund", category: "DEDUCTION", amount: -400.0, type: "DEDUCTION" as const },
    ],
  },
];

function money(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Download, ArrowRight, Loader2, LayoutList, Kanban, FileText, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { generatePayslipPDF } from "@/lib/payslip-pdf";

const MOCK_PAYSLIPS = [
  {
    id: "PS-1001",
    employeeName: "Alice Johnson",
    employeeId: "EMP-001",
    department: "Engineering",
    position: "Senior Frontend Engineer",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    contractRef: "CON-1001 (Standard Tech)",
    gross: 10000,
    deductions: 2500,
    net: 7500,
    status: "PAID" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 8000.0, type: "EARNING" as const },
      { rule: "Housing Allowance (HRA)", category: "ALLOWANCE", amount: 1500.0, type: "EARNING" as const },
      { rule: "Transport & Remote Allowance", category: "ALLOWANCE", amount: 500.0, type: "EARNING" as const },
      { rule: "Income Tax Withholding", category: "DEDUCTION", amount: -1800.0, type: "DEDUCTION" as const },
      { rule: "Retirement / Provident Fund", category: "DEDUCTION", amount: -400.0, type: "DEDUCTION" as const },
      { rule: "Health & Medical Insurance", category: "DEDUCTION", amount: -300.0, type: "DEDUCTION" as const },
    ],
  },
  {
    id: "PS-1002",
    employeeName: "Bob Smith",
    employeeId: "EMP-002",
    department: "Human Resources",
    position: "HR Manager",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    contractRef: "CON-1002 (HR Package)",
    gross: 7916.67,
    deductions: 1800,
    net: 6116.67,
    status: "PAID" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 6500.0, type: "EARNING" as const },
      { rule: "Housing Allowance", category: "ALLOWANCE", amount: 1416.67, type: "EARNING" as const },
      { rule: "Income Tax Withholding", category: "DEDUCTION", amount: -1400.0, type: "DEDUCTION" as const },
      { rule: "Provident Fund", category: "DEDUCTION", amount: -400.0, type: "DEDUCTION" as const },
    ],
  },
  {
    id: "PS-1101",
    employeeName: "Alice Johnson",
    employeeId: "EMP-001",
    department: "Engineering",
    position: "Senior Frontend Engineer",
    period: "2023-11",
    payrun: "November 2023 Payroll",
    contractRef: "CON-1001 (Standard Tech)",
    gross: 10000,
    deductions: 2500,
    net: 7500,
    status: "DRAFT" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 8000.0, type: "EARNING" as const },
      { rule: "Allowances", category: "ALLOWANCE", amount: 2000.0, type: "EARNING" as const },
      { rule: "Deductions", category: "DEDUCTION", amount: -2500.0, type: "DEDUCTION" as const },
    ],
  },
  {
    id: "PS-1004",
    employeeName: "Emily Watson",
    employeeId: "EMP-004",
    department: "Product & Design",
    position: "Lead UX Designer",
    period: "2023-10",
    payrun: "October 2023 Payroll",
    contractRef: "CON-1004 (Design Lead)",
    gross: 8500,
    deductions: 1700,
    net: 6800,
    status: "PAID" as const,
    lines: [
      { rule: "Basic Salary", category: "BASIC", amount: 7000.0, type: "EARNING" as const },
      { rule: "Creative Allowance", category: "ALLOWANCE", amount: 1500.0, type: "EARNING" as const },
      { rule: "Income Tax", category: "DEDUCTION", amount: -1300.0, type: "DEDUCTION" as const },
      { rule: "Provident Fund", category: "DEDUCTION", amount: -400.0, type: "DEDUCTION" as const },
    ],
  },
];

function money(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export default function PayslipsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const role = session?.user?.role || "ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const currentUserName = session?.user?.name || "Emily Watson";
  const currentEmpId = session?.user?.employeeId || "EMP-004";

  const scopedPayslips = isEmployee
    ? MOCK_PAYSLIPS.filter(
        (p) =>
          p.employeeId === currentEmpId ||
          p.employeeName.toLowerCase() === currentUserName.toLowerCase()
      )
    : MOCK_PAYSLIPS;

  const filteredPayslips = scopedPayslips.filter(
    (p) =>
      p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      p.payrun.toLowerCase().includes(search.toLowerCase()) ||
      p.period.includes(search) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (slip: (typeof MOCK_PAYSLIPS)[0]) => {
    setDownloadingId(slip.id);
    await new Promise((r) => setTimeout(r, 500));

    try {
      generatePayslipPDF(slip);
      toast({
        title: "Payslip Downloaded",
        description: `Exported PDF for ${slip.employeeName} (${slip.id}).`,
        type: "success",
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF.",
        type: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const paidSlips = filteredPayslips.filter((p) => p.status === "PAID");
  const draftSlips = filteredPayslips.filter((p) => p.status === "DRAFT");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            {isEmployee ? "My Payslips" : "Payslips"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEmployee
              ? "Your historical salary statements and printable compensation receipts."
              : "Generated employee salary statements ready for review and delivery."}
          </p>
        </div>

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
      </div>

      {/* Filter Bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter payslips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredPayslips.length} {filteredPayslips.length === 1 ? "payslip" : "payslips"}
        </span>
      </div>

      {/* Content View */}
      {viewMode === "list" ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[95px]">Ref</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-semibold">Net Salary</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-20 text-center text-xs text-muted-foreground">
                    No payslips found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayslips.map((payslip) => {
                  const isDownloading = downloadingId === payslip.id;

                  return (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{payslip.id}</TableCell>
                      <TableCell className="font-medium text-xs">
                        <Link href={`/payroll/payslips/${payslip.id}`} className="hover:underline">
                          {payslip.employeeName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{payslip.payrun}</TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{payslip.period}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{money(payslip.gross)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-rose-600">-{money(payslip.deductions)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">{money(payslip.net)}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={payslip.status === "PAID" ? "success" : "secondary"}
                          className="text-[10px] font-mono"
                        >
                          {payslip.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right p-1.5">
                        <div className="flex justify-end items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(payslip)}
                            disabled={isDownloading}
                            className="h-6 px-2 text-[11px] gap-1"
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            <span>{isDownloading ? "PDF..." : "PDF"}</span>
                          </Button>
                          <Link href={`/payroll/payslips/${payslip.id}`}>
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
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
          {/* Paid Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Paid & Disbursed ({paidSlips.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {paidSlips.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No paid payslips.
                </div>
              ) : (
                paidSlips.map((p) => {
                  const isDownloading = downloadingId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-lg border border-border/80 bg-card hover:border-emerald-500/40 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground font-mono">{p.id}</h4>
                          <p className="text-xs font-medium text-foreground mt-0.5">{p.employeeName}</p>
                          <p className="text-[11px] text-muted-foreground">{p.position}</p>
                        </div>
                        <Badge variant="success" className="text-[10px] font-mono shrink-0">
                          {p.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono pt-1.5 border-t border-border/40 text-center">
                        <div className="bg-muted/40 p-1 rounded">
                          <p className="text-[9px] uppercase text-muted-foreground">Gross</p>
                          <p className="font-semibold text-foreground">{money(p.gross)}</p>
                        </div>
                        <div className="bg-rose-500/10 p-1 rounded">
                          <p className="text-[9px] uppercase text-rose-600">Deduct</p>
                          <p className="font-semibold text-rose-600">-{money(p.deductions)}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-1 rounded">
                          <p className="text-[9px] uppercase text-emerald-600">Net</p>
                          <p className="font-bold text-emerald-600">{money(p.net)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Period {p.period}
                        </span>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleDownload(p)}
                          disabled={isDownloading}
                          className="h-6 text-[10px] gap-1"
                        >
                          {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          PDF
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Draft Column */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Draft & Pending ({draftSlips.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {draftSlips.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No draft payslips.
                </div>
              ) : (
                draftSlips.map((p) => {
                  const isDownloading = downloadingId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-lg border border-border/80 bg-card hover:border-amber-500/40 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-semibold text-foreground font-mono">{p.id}</h4>
                          <p className="text-xs font-medium text-foreground mt-0.5">{p.employeeName}</p>
                          <p className="text-[11px] text-muted-foreground">{p.position}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                          {p.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono pt-1.5 border-t border-border/40 text-center">
                        <div className="bg-muted/40 p-1 rounded">
                          <p className="text-[9px] uppercase text-muted-foreground">Gross</p>
                          <p className="font-semibold text-foreground">{money(p.gross)}</p>
                        </div>
                        <div className="bg-rose-500/10 p-1 rounded">
                          <p className="text-[9px] uppercase text-rose-600">Deduct</p>
                          <p className="font-semibold text-rose-600">-{money(p.deductions)}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-1 rounded">
                          <p className="text-[9px] uppercase text-emerald-600">Net</p>
                          <p className="font-bold text-emerald-600">{money(p.net)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Period {p.period}
                        </span>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleDownload(p)}
                          disabled={isDownloading}
                          className="h-6 text-[10px] gap-1"
                        >
                          {isDownloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          PDF
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

