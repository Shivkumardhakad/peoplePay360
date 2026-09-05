import Link from "next/link";
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payslips</h1>
        <p className="text-sm text-muted-foreground">Generated employee salary statements ready for review and delivery.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Payrun</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PAYSLIPS.map((payslip) => (
              <TableRow key={payslip.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/payroll/payslips/${payslip.id}`} className="hover:underline">
                    {payslip.employee}
                  </Link>
                </TableCell>
                <TableCell>{payslip.payrun}</TableCell>
                <TableCell className="font-mono text-muted-foreground">{payslip.period}</TableCell>
                <TableCell className="text-right font-mono">{money(payslip.gross)}</TableCell>
                <TableCell className="text-right font-mono text-destructive">-{money(payslip.deductions)}</TableCell>
                <TableCell className="text-right font-mono font-bold text-accent">{money(payslip.net)}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    payslip.status === "PAID" ? "bg-success/10 text-success" : "bg-muted/20 text-muted-foreground"
                  }`}>
                    {payslip.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* TODO: Replace MOCK_PAYSLIPS with the payroll API payslip list, filtered by employee role when needed. */}
    </div>
  );
}
