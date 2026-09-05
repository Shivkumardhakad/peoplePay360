import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";

const MOCK_PAYSLIP = {
  id: "PS-1001",
  employee: "Alice Johnson",
  period: "October 2023",
  contract: "CON-1001 (Senior Frontend Engineer)",
  lines: [
    { rule: "Basic Salary", category: "BASIC", amount: 10000.00, type: "EARNING" },
    { rule: "Health Insurance", category: "DEDUCTION", amount: -300.00, type: "DEDUCTION" },
    { rule: "Income Tax", category: "DEDUCTION", amount: -2200.00, type: "DEDUCTION" },
  ],
  net: 7500.00,
};

export default async function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: payslipId } = await params;
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payroll/payslips">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Payslip {payslipId}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {MOCK_PAYSLIP.period}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{MOCK_PAYSLIP.employee} • {MOCK_PAYSLIP.contract}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Printer className="w-4 h-4" />
          Print Payslip
        </Button>
      </div>

      <Card className="pp-solid-surface overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold">Salary Ledger Statement</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Contract: {MOCK_PAYSLIP.contract}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">PeoplePay360 Inc.</p>
              <p className="text-xs text-muted-foreground font-mono">123 Business Rd, Tech City</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10 border-b border-border">
                <TableHead className="py-3 px-6">Salary Component / Rule</TableHead>
                <TableHead className="py-3 px-6 text-center">Category</TableHead>
                <TableHead className="py-3 px-6 text-right">Line Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PAYSLIP.lines.map((line, idx) => (
                <TableRow key={idx} className="border-b border-border/50 hover:bg-transparent">
                  <TableCell className="py-3 px-6 font-medium">{line.rule}</TableCell>
                  <TableCell className="py-3 px-6 text-center font-mono text-xs text-muted-foreground">{line.category}</TableCell>
                  <TableCell className={`py-3 px-6 text-right font-mono text-sm ${line.type === 'DEDUCTION' ? 'text-destructive' : 'text-foreground'}`}>
                    {line.amount > 0 ? '' : '-'}${Math.abs(line.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2 border-border hover:bg-transparent bg-muted/10">
                <TableCell colSpan={2} className="py-4 px-6 text-right font-bold text-sm tracking-wide">
                  NET SALARY PAYABLE
                </TableCell>
                <TableCell className="py-4 px-6 text-right font-mono text-xl font-bold text-accent">
                  ${MOCK_PAYSLIP.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
