"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Calculator, CheckCircle, CreditCard, Send, ArrowLeft } from "lucide-react";

type PayrunStatus = "DRAFT" | "COMPUTED" | "VALIDATED" | "PAID";

const MOCK_PAYSLIPS = [
  { id: "PS-1001", employee: "Alice Johnson", gross: 10000.00, deductions: 2500.00, net: 7500.00 },
  { id: "PS-1002", employee: "Bob Smith", gross: 7916.67, deductions: 1800.00, net: 6116.67 },
];

export default function PayrunProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: payrunId } = use(params);
  const [status, setStatus] = useState<PayrunStatus>("DRAFT");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payroll/payruns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">October 2023 Payroll</h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {payrunId}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === 'PAID' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">Standard Tech Package • 2023-10-01 to 2023-10-31</p>
        </div>
      </div>

      {/* Lifecycle Action Bar as Glass */}
      <div className="p-4 pp-glass flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button 
            variant={status === "DRAFT" ? "default" : "outline"}
            disabled={status !== "DRAFT"}
            onClick={() => setStatus("COMPUTED")}
            className={status === "DRAFT" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Compute
          </Button>
          
          <div className="w-8 h-px bg-border"></div>
          
          <Button 
            variant={status === "COMPUTED" ? "default" : "outline"}
            disabled={status !== "COMPUTED"}
            onClick={() => setStatus("VALIDATED")}
            className={status === "COMPUTED" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Validate
          </Button>

          <div className="w-8 h-px bg-border"></div>

          <Button 
            variant={status === "VALIDATED" ? "default" : "outline"}
            disabled={status !== "VALIDATED"}
            onClick={() => setStatus("PAID")}
            className={status === "VALIDATED" ? "bg-success text-success-foreground hover:bg-success/90" : ""}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Mark Paid
          </Button>

          <div className="w-8 h-px bg-border"></div>

          <Button 
            variant="outline"
            disabled={status !== "PAID"}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Payslips
          </Button>
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Step <span className="font-bold text-foreground">{status === 'DRAFT' ? '1/4' : status === 'COMPUTED' ? '2/4' : status === 'VALIDATED' ? '3/4' : '4/4'}</span>
        </div>
      </div>

      {/* Inline Warning Alert */}
      {status === "COMPUTED" && (
        <div className="flex items-start gap-3 p-4 bg-destructive/5 border-l-4 border-l-destructive rounded-r-md">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-destructive">Payroll Warning: Missing Bank Information</h4>
            <p className="text-xs text-destructive/80 mt-1">Bob Smith is missing bank details. Payment cannot be finalized until resolved.</p>
          </div>
        </div>
      )}

      {/* Generated Payslips Table as Solid Surface */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead>Payslip Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Gross Salary</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right font-bold">Net Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === "DRAFT" ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-mono text-sm">
                  Click [Compute] in the action bar above to calculate employee payslips.
                </TableCell>
              </TableRow>
            ) : (
              MOCK_PAYSLIPS.map((ps) => (
                <TableRow key={ps.id} className="hover:bg-muted/50 border-b border-border/60">
                  <TableCell className="font-mono text-xs text-muted-foreground">{ps.id}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/payroll/payslips/${ps.id}`} className="hover:underline">
                      {ps.employee}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-right text-muted-foreground text-xs">
                    ${ps.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono text-right text-destructive text-xs">
                    -${ps.deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono text-right font-bold text-accent text-sm">
                    ${ps.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
