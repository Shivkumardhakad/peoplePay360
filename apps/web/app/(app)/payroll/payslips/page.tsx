"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Download, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { generatePayslipPDF } from "@/lib/payslip-pdf";
import { listPayrollPayslipsAction } from "@/lib/api-actions";

function money(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export default function PayslipsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [livePayslips, setLivePayslips] = useState<any[]>([]);

  useEffect(() => { listPayrollPayslipsAction().then(setLivePayslips).catch((error) => toast({ title: "Payroll API unavailable", description: error.message, type: "error" })); }, [toast]);

  const role = session?.user?.role || "ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const currentUserName = session?.user?.name || "";
  const currentEmpId = session?.user?.employeeId || "";

  // RBAC Scoping: Employees see ONLY their own payslips. Managers see all company payslips.
  const scopedPayslips = isEmployee
    ? livePayslips.filter(
        (p) =>
          p.employeeId === currentEmpId ||
          p.employeeName.toLowerCase() === currentUserName.toLowerCase()
      )
    : livePayslips;

  const filteredPayslips = scopedPayslips.filter(
    (p) =>
      p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      p.payrun.toLowerCase().includes(search.toLowerCase()) ||
      p.period.includes(search) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = async (slip: any) => {
    setDownloadingId(slip.id);
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

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={8} className="h-20 text-center text-xs text-muted-foreground">
                  No payslips found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayslips.map((payslip) => {
                const isDownloading = downloadingId === payslip.id;

                return (
                  <TableRow key={payslip.id}>
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
    </div>
  );
}
