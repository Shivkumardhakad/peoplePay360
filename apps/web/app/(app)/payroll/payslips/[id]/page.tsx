"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { generatePayslipPDF } from "@/lib/payslip-pdf";
import { getPayslipAction } from "@/lib/api-actions";
import { ArrowLeft, Printer, Download, CheckCircle, FileText, Loader2 } from "lucide-react";

export default function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: payslipId } = use(params);
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [livePayslip, setLivePayslip] = useState<any>(null);

  useEffect(() => { getPayslipAction(payslipId).then(setLivePayslip).catch(() => setLivePayslip({ error: true })); }, [payslipId]);

  if (livePayslip?.error) return <div className="p-6 text-sm text-destructive">Payslip could not be loaded from Payroll API.</div>;
  if (!livePayslip) return <div className="p-6 text-sm text-muted-foreground">Loading payslip...</div>;
  const payslip = livePayslip;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      generatePayslipPDF(payslip);
      toast({
        title: "Payslip Downloaded",
        description: `Exported PDF for ${payslip.employeeName} (${payslipId}).`,
        type: "success",
      });
    } catch {
      toast({
        title: "Print Failed",
        description: "Unable to generate PDF document.",
        type: "error",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    window.print();
    setPrinting(false);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/payroll/payslips">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-foreground">Payslip {payslipId}</h1>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                {payslip.period}
              </span>
              <Badge variant="success" className="text-[10px] font-mono">
                <CheckCircle className="w-3 h-3 mr-1" /> Paid
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {payslip.employeeName} • {payslip.department} • {payslip.contractRef}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={printing}
            className="gap-1.5 h-8 text-xs"
          >
            {printing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            <span>Print</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="gap-1.5 h-8 text-xs"
          >
            {downloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Payslip Document Card */}
      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="border-b border-border bg-muted/20 p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold">Salary Ledger Statement</CardTitle>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                Contract: {payslip.contractRef}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                Employee Ref: {payslip.employeeId}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-foreground">PeoplePay360 Inc.</p>
              <p className="text-[11px] text-muted-foreground font-mono">Enterprise Payroll</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-2 px-4 text-[11px]">Salary Component / Rule</TableHead>
                <TableHead className="py-2 px-4 text-center text-[11px]">Category</TableHead>
                <TableHead className="py-2 px-4 text-right text-[11px]">Line Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslip.lines.map((line: any, idx: number) => (
                <TableRow key={idx} className="hover:bg-transparent">
                  <TableCell className="py-2 px-4 text-xs font-medium">{line.rule}</TableCell>
                  <TableCell className="py-2 px-4 text-center font-mono text-[11px] text-muted-foreground">
                    {line.category}
                  </TableCell>
                  <TableCell
                    className={`py-2 px-4 text-right font-mono text-xs ${
                      line.type === "DEDUCTION" ? "text-rose-600 font-medium" : "text-foreground"
                    }`}
                  >
                    {line.amount > 0 ? "" : "-"}${Math.abs(line.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}

              <TableRow className="bg-muted/10 border-t border-border hover:bg-transparent">
                <TableCell colSpan={2} className="py-2 px-4 text-right font-mono text-[11px] text-muted-foreground">
                  GROSS SALARY EARNINGS
                </TableCell>
                <TableCell className="py-2 px-4 text-right font-mono text-xs font-semibold">
                  ${payslip.gross.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/10 border-b border-border hover:bg-transparent">
                <TableCell colSpan={2} className="py-2 px-4 text-right font-mono text-[11px] text-muted-foreground">
                  TOTAL STATUTORY & BENEFIT DEDUCTIONS
                </TableCell>
                <TableCell className="py-2 px-4 text-right font-mono text-xs font-semibold text-rose-600">
                  -${payslip.deductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>

              <TableRow className="border-t border-border bg-muted/40 hover:bg-muted/40">
                <TableCell colSpan={2} className="py-3 px-4 text-right font-bold text-xs tracking-wide">
                  NET SALARY PAYABLE (CREDITED)
                </TableCell>
                <TableCell className="py-3 px-4 text-right font-mono text-base font-bold text-foreground">
                  ${payslip.net.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
