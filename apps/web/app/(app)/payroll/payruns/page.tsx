"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listPayrunsAction } from "@/lib/api-actions";

export default function PayrunsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [payruns, setPayruns] = useState<any[]>([]);

  useEffect(() => {
    listPayrunsAction().then((result) => setPayruns(result as any[])).catch(() => setPayruns([]));
  }, []);

  const filteredPayruns = payruns.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.salaryStructureId.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenBatch = (id: string) => {
    setOpeningId(id);
    router.push(`/payroll/payruns/${id}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Payruns</h1>
          <p className="text-xs text-muted-foreground">Manage payroll processing batches and lifecycle states.</p>
        </div>
        <Link href="/payroll/payruns/new">
          <Button size="sm" className="gap-1.5 h-8">
            <Plus className="w-3.5 h-3.5" />
            Create Payrun
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter payrun batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredPayruns.length} batches
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Batch Ref</TableHead>
              <TableHead>Batch Name</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Salary Structure</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Net Total</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="w-[90px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayruns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-20 text-center text-xs text-muted-foreground">
                  No payrun batches found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayruns.map((payrun) => {
                const isOpening = openingId === payrun.id;

                return (
                  <TableRow key={payrun.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{payrun.id}</TableCell>
                    <TableCell className="font-medium text-xs">
                      <Link href={`/payroll/payruns/${payrun.id}`} className="hover:underline">
                        {payrun.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                      {payrun.periodStart} → {payrun.periodEnd}
                    </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{payrun.salaryStructureId}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{payrun.payslips?.length ?? 0}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      ${(payrun.payslips ?? []).reduce((total: number, slip: any) => total + Number(slip.netAmount ?? 0), 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          payrun.status === "PAID"
                            ? "success"
                            : payrun.status === "DRAFT"
                            ? "secondary"
                            : "default"
                        }
                        className="text-[10px] font-mono"
                      >
                        {payrun.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right p-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenBatch(payrun.id)}
                        disabled={isOpening}
                        className="h-6 px-2 text-[11px] gap-1"
                      >
                        {isOpening ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3 h-3" />
                        )}
                        <span>{isOpening ? "Opening..." : "View"}</span>
                      </Button>
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
