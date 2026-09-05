"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import {
  computePayrunAction,
  validatePayrunAction,
  markPayrunPaidAction,
  sendPayrunPayslipsAction,
  getPayrunAction,
  listPayrunPayslipsAction,
} from "@/lib/api-actions";
import {
  Calculator,
  CheckCircle,
  CreditCard,
  Send,
  ArrowLeft,
  Loader2,
  ShieldAlert,
} from "lucide-react";

type PayrunStatus = "DRAFT" | "COMPUTED" | "VALIDATED" | "PAID";

interface Slip {
  id: string;
  employee: string;
  gross: number;
  deductions: number;
  net: number;
}

export default function PayrunProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: payrunId } = use(params);
  const { data: session } = useSession();
  const { toast } = useToast();

  const [status, setStatus] = useState<PayrunStatus>("DRAFT");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [payrun, setPayrun] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);

  const reload = async () => {
    const [loadedPayrun, loadedPayslips] = await Promise.all([getPayrunAction(payrunId), listPayrunPayslipsAction(payrunId)]);
    setPayrun(loadedPayrun);
    setStatus((loadedPayrun as any).status as PayrunStatus);
    setPayslips(loadedPayslips as any[]);
  };

  useEffect(() => { reload().catch((error) => toast({ title: "Unable to load payrun", description: error.message, type: "error" })); }, [payrunId]);

  const role = session?.user?.role || "ADMIN";
  const canFinalize =
    role === "ADMIN" ||
    role === "PAYROLL_MANAGER" ||
    role === "HR_PAYROLL_MANAGER";

  const handleCompute = async () => {
    setLoadingAction("compute");
    try {
      await computePayrunAction(payrunId);
      await reload();
      toast({
        title: "Payslips Computed",
        description: "Applied active salary rules and attendance hours.",
        type: "success",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleValidate = async () => {
    setLoadingAction("validate");
    try {
      await validatePayrunAction(payrunId);
      await reload();
      toast({
        title: "Payrun Validated",
        description: "Checked contracts, banking details, and tax thresholds.",
        type: "info",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkPaid = async () => {
    setLoadingAction("pay");
    try {
      await markPayrunPaidAction(payrunId);
      await reload();
      toast({
        title: "Payrun Finalized & Paid",
        description: "Direct bank transfer ledger entries recorded.",
        type: "success",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendPayslips = async () => {
    setLoadingAction("send");
    try {
      const res = await sendPayrunPayslipsAction(payrunId);
      await new Promise((r) => setTimeout(r, 500));
      toast({
        title: "Payslips Dispatched",
        description: res.message || "Emailed digital payslips to all batch employees.",
        type: "success",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/payroll/payruns">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-foreground">{payrun?.name ?? "Payrun"}</h1>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {payrunId}
            </span>
            <Badge
              variant={
                status === "PAID"
                  ? "success"
                  : status === "VALIDATED"
                  ? "default"
                  : status === "COMPUTED"
                  ? "warning"
                  : "secondary"
              }
              className="text-[10px] font-mono"
            >
              {status}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">
            {payrun?.salaryStructureId ?? "-"} • {payrun?.periodStart?.slice(0, 10) ?? "-"} – {payrun?.periodEnd?.slice(0, 10) ?? "-"}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-2.5 rounded-lg border border-border bg-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Step 1: Compute */}
          <Button
            size="sm"
            variant={status === "DRAFT" ? "default" : "outline"}
            disabled={status !== "DRAFT" || loadingAction !== null}
            onClick={handleCompute}
            className="gap-1.5 h-7 text-xs"
          >
            {loadingAction === "compute" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Calculator className="w-3 h-3" />
            )}
            {loadingAction === "compute" ? "Computing..." : "Compute"}
          </Button>

          {/* Step 2: Validate */}
          <Button
            size="sm"
            variant={status === "COMPUTED" ? "default" : "outline"}
            disabled={status !== "COMPUTED" || loadingAction !== null}
            onClick={handleValidate}
            className="gap-1.5 h-7 text-xs"
          >
            {loadingAction === "validate" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            {loadingAction === "validate" ? "Validating..." : "Validate"}
          </Button>

          {/* Step 3: Mark Paid */}
          {canFinalize && (
            <Button
              size="sm"
              variant={status === "VALIDATED" ? "default" : "outline"}
              disabled={status !== "VALIDATED" || loadingAction !== null}
              onClick={handleMarkPaid}
              className={`gap-1.5 h-7 text-xs ${status === "VALIDATED" ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}`}
            >
              {loadingAction === "pay" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CreditCard className="w-3 h-3" />
              )}
              {loadingAction === "pay" ? "Finalizing..." : "Mark Paid"}
            </Button>
          )}

          {/* Step 4: Send Payslips */}
          <Button
            size="sm"
            variant="outline"
            disabled={status !== "PAID" || loadingAction !== null}
            onClick={handleSendPayslips}
            className="gap-1.5 h-7 text-xs"
          >
            {loadingAction === "send" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
            {loadingAction === "send" ? "Dispatching..." : "Send Payslips"}
          </Button>
        </div>

        <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
          <span>Batch Lifecycle:</span>
          <span className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            {status === "DRAFT" ? "Stage 1/4" : status === "COMPUTED" ? "Stage 2/4" : status === "VALIDATED" ? "Stage 3/4" : "Stage 4/4"}
          </span>
        </div>
      </div>

      {/* Warning Notice */}
      {status === "COMPUTED" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold">Pre-validation Note</p>
            <p className="text-[11px] text-muted-foreground">
              Payroll API returned computed payslips. Review warnings before validation.
            </p>
          </div>
        </div>
      )}

      {/* Generated Payslips */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Gross Earnings</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right font-bold">Net Salary</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status === "DRAFT" ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-mono text-xs">
                  Payrun batch in DRAFT. Click <span className="font-semibold text-foreground">[Compute]</span> to calculate employee payslips.
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((ps) => (
                <TableRow key={ps.id}>
                  <TableCell className="font-medium text-xs">
                    <Link href={`/payroll/payslips/${ps.id}`} className="hover:underline">
                      {ps.employeeName ?? ps.employeeId}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-right text-xs text-muted-foreground">
                    ${Number(ps.grossAmount ?? ps.gross ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono text-right text-xs text-rose-600 font-medium">
                    -${Number(ps.deductionAmount ?? ps.deductions ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="font-mono text-right text-xs font-bold text-foreground">
                    ${Number(ps.netAmount ?? ps.net ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right p-1.5">
                    <Link
                      href={`/payroll/payslips/${ps.id}`}
                      className="text-xs text-muted-foreground hover:text-foreground font-mono"
                    >
                      View
                    </Link>
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
