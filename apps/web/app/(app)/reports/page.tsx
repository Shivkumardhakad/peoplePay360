"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { getPayrollReportAction } from "@/lib/api-actions";

export default function PayrollReportsPage() {
  const { toast } = useToast();
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-01-01`);
  const [to, setTo] = useState(now.toISOString().slice(0, 10));
  const [status, setStatus] = useState("");
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    getPayrollReportAction(from, to, status).then(setReport).catch((error) => toast({ title: "Unable to load reports", description: error.message, type: "error" }));
  }, [from, status, to, toast]);

  const summary = report?.summary;
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-base font-semibold tracking-tight">Payroll Reports</h1>
        <p className="text-xs text-muted-foreground">Live report data from persisted payruns and payslips.</p>
      </div>
      <div className="p-2 rounded-lg border border-border bg-card flex flex-wrap items-center gap-3">
        <label className="text-[11px] font-mono text-muted-foreground" htmlFor="report-from">From</label>
        <Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="h-7 w-auto text-xs font-mono" />
        <label className="text-[11px] font-mono text-muted-foreground" htmlFor="report-to">To</label>
        <Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="h-7 w-auto text-xs font-mono" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-7 rounded-md border border-input bg-background px-2 text-xs">
          <option value="">All statuses</option><option value="DRAFT">Draft</option><option value="COMPUTED">Computed</option><option value="VALIDATED">Validated</option><option value="PAID">Paid</option>
        </select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        {[['Payruns', summary?.payrunCount ?? 0], ['Payslips', summary?.payslipCount ?? 0], ['Gross', `$${Number(summary?.grossAmount ?? 0).toLocaleString()}`], ['Deductions', `$${Number(summary?.deductionAmount ?? 0).toLocaleString()}`], ['Net', `$${Number(summary?.netAmount ?? 0).toLocaleString()}`]].map(([label, value]) => <Card key={String(label)} className="p-3"><p className="text-[10px] uppercase font-mono text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold font-mono">{value}</p></Card>)}
      </div>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Net</TableHead></TableRow></TableHeader><TableBody>
          {(report?.payslips ?? []).map((row: any) => <TableRow key={row.payslipId}><TableCell className="text-xs font-medium">{row.employeeName}</TableCell><TableCell className="text-xs text-muted-foreground">{row.department}</TableCell><TableCell className="text-xs font-mono">{String(row.periodStart).slice(0, 10)} → {String(row.periodEnd).slice(0, 10)}</TableCell><TableCell><Badge variant={row.status === "PAID" ? "success" : "secondary"} className="text-[10px]">{row.status}</Badge></TableCell><TableCell className="text-right text-xs font-mono">${Number(row.netAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell></TableRow>)}
          {report && !report.payslips.length && <TableRow><TableCell colSpan={5} className="h-20 text-center text-xs text-muted-foreground">No payslips found for this range.</TableCell></TableRow>}
        </TableBody></Table>
      </div>
    </div>
  );
}
