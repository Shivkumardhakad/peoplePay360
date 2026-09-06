"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getPayrollAuditLogAction } from "@/lib/api-actions";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getPayrollAuditLogAction().then((result) => setEntries(result as any[])).catch((error) => toast({ title: "Unable to load audit logs", description: error instanceof Error ? error.message : "Request failed", type: "error" })).finally(() => setLoading(false)); }, [toast]);

  const findings = entries.flatMap((entry) => (entry.audit?.findings ?? []).map((finding: any) => ({ ...finding, payrunId: entry.payrunId, payrunName: entry.payrunName, periodStart: entry.periodStart })));
  const passed = entries.filter((entry) => entry.audit?.passed).length;
  const risks = findings.filter((finding) => finding.severity !== "INFO").length;

  return <div className="space-y-4"><div><h1 className="text-base font-semibold">Audit &amp; Logs</h1><p className="text-xs text-muted-foreground">Payroll validation history and findings from live payrun records.</p></div><div className="grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground">Payruns reviewed</p><p className="mt-1 text-xl font-semibold">{entries.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground">Passed audits</p><p className="mt-1 text-xl font-semibold text-emerald-600">{passed}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-[11px] text-muted-foreground">Findings</p><p className="mt-1 text-xl font-semibold text-amber-600">{risks}</p></CardContent></Card></div><Card><CardHeader><CardTitle className="text-sm">Payroll audit trail</CardTitle></CardHeader><CardContent>{loading ? <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading audit history...</div> : entries.length === 0 ? <div className="py-8 text-center text-xs text-muted-foreground">No computed or finalized payruns have been audited yet.</div> : <div className="space-y-3">{entries.map((entry) => <div key={entry.payrunId} className="rounded-md border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-medium">{entry.audit?.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}{entry.payrunName}<Badge variant={entry.audit?.passed ? "success" : "warning"} className="text-[10px]">{entry.audit?.passed ? "PASSED" : "REVIEW"}</Badge><Badge variant="secondary" className="text-[10px]">{entry.status}</Badge></div><Link href={`/payroll/payruns/${entry.payrunId}`}><Button variant="ghost" size="sm" className="h-7 text-[11px]">Open payrun <ExternalLink className="ml-1 h-3 w-3" /></Button></Link></div><p className="mt-1 text-[11px] text-muted-foreground">{String(entry.periodStart).slice(0, 10)} · auditor {entry.audit?.auditorVersion ?? "-"} · {entry.audit?.findings?.length ?? 0} finding(s)</p>{entry.audit?.findings?.length ? <div className="mt-2 space-y-1">{entry.audit.findings.map((finding: any, index: number) => <div key={`${entry.payrunId}-${index}`} className="flex items-start gap-2 rounded bg-muted/50 px-2 py-1.5 text-[11px]"><ShieldCheck className={`mt-0.5 h-3.5 w-3.5 ${finding.severity === "ERROR" ? "text-destructive" : "text-amber-600"}`} /><span><span className="font-mono font-semibold">{finding.code}</span> — {finding.message}</span></div>)}</div> : <p className="mt-2 text-[11px] text-emerald-700">No audit findings.</p>}</div>)}</div>}</CardContent></Card></div>;
}
