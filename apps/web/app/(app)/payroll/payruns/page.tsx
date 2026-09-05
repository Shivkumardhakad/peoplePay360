import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  if (status === "PAID") {
    return "bg-success/10 text-success";
  }

  if (status === "DRAFT") {
    return "bg-muted/20 text-muted-foreground";
  }

  return "bg-primary/10 text-primary";
}

export default function PayrunsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payruns</h1>
          <p className="text-sm text-muted-foreground">Payroll batches by period, structure, and lifecycle status.</p>
        </div>
        <Link href="/payroll/payruns/new">
          <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            Create Payrun
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Net Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_PAYRUNS.map((payrun) => (
              <TableRow key={payrun.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <Link href={`/payroll/payruns/${payrun.id}`} className="hover:underline">
                    {payrun.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {payrun.periodStart} to {payrun.periodEnd}
                </TableCell>
                <TableCell>{payrun.structure}</TableCell>
                <TableCell className="text-right font-mono">{payrun.employees}</TableCell>
                <TableCell className="text-right font-mono">
                  ${payrun.netTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(payrun.status)}`}>
                    {payrun.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* TODO: Replace MOCK_PAYRUNS with the payroll API payrun list. */}
    </div>
  );
}
