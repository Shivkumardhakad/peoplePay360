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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/payroll/payruns">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">October 2023 Payroll</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === 'PAID' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Standard Tech Package • Oct 1 - Oct 31, 2023</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-3 p-4 bg-muted/30 border rounded-lg">
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

      {/* Warnings Section - shows conditionally based on mock state or validation */}
      {status === "COMPUTED" && (
        <div className="flex items-start gap-3 p-4 bg-destructive/5 border-l-4 border-l-destructive rounded-r-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-destructive">Review required</h4>
            <p className="text-sm text-destructive/80 mt-1">Bob Smith is missing bank details. Payment cannot be processed until resolved.</p>
          </div>
        </div>
      )}

      {/* Payslips List */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Gross Amount</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right font-bold">Net Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === "DRAFT" ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Click Compute to generate payslip figures.
                </TableCell>
              </TableRow>
            ) : (
              MOCK_PAYSLIPS.map((ps) => (
                <TableRow key={ps.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/payroll/payslips/${ps.id}`} className="hover:underline">
                      {ps.employee}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-right text-muted-foreground">
                    ${ps.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono text-right text-destructive">
                    -${ps.deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono text-right font-bold text-accent">
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
