"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { SalaryStructureForm, type SalaryStructureFormValues } from "@/components/salary-structure-form";
import { Layers, CheckCircle2, Archive, Loader2, Lock } from "lucide-react";
import { createPayrollStructureAction, listPayrollRulesAction, listPayrollStructuresAction } from "@/lib/api-actions";

interface StructureItem {
  id: string;
  name: string;
  ruleCount: number;
  status: "Active" | "Draft" | "Archived";
}

export default function SalaryStructuresPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [structures, setStructures] = useState<StructureItem[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const role = session?.user?.role || "ADMIN";
  const canEdit =
    role === "ADMIN" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER";

  useEffect(() => {
    Promise.all([listPayrollStructuresAction(), listPayrollRulesAction()]).then(([loadedStructures, loadedRules]) => {
      setRules(loadedRules as any[]);
      setStructures((loadedStructures as any[]).map((structure) => ({ id: structure.id, name: structure.name, ruleCount: structure.rules?.length ?? 0, status: structure.status === "ACTIVE" ? "Active" : structure.status === "DRAFT" ? "Draft" : "Archived" })));
    }).catch((error) => toast({ title: "Payroll API unavailable", description: error.message, type: "error" }));
  }, [toast]);

  const handleCreated = (data: SalaryStructureFormValues) => {
    void data;
  };

  const handleToggleStatus = async (id: string) => {
    setTogglingId(id);
    await new Promise((r) => setTimeout(r, 400));
    setStructures((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === "Active" ? "Archived" : "Active" } : s
      )
    );
    setTogglingId(null);
    toast({
      title: "Structure Status Updated",
      description: `Structure ${id} updated.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-primary" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">Salary Structures</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Reusable containers for ordered salary rules linked to employment contracts.
          </p>
        </div>
        {!canEdit && (
          <Badge variant="outline" className="text-[10px] font-mono gap-1 text-muted-foreground">
            <Lock className="w-3 h-3" />
            Read-Only (Requires HR Payroll Manager)
          </Badge>
        )}
      </div>

      <div className={`grid grid-cols-1 ${canEdit ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-3 items-start`}>
        {/* Table */}
        <div className={`${canEdit ? "lg:col-span-2" : "col-span-1"} rounded-lg border border-border bg-card overflow-hidden`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ref ID</TableHead>
                <TableHead>Structure Name</TableHead>
                <TableHead className="text-right">Rules</TableHead>
                <TableHead className="text-right">Status</TableHead>
                {canEdit && <TableHead className="w-[80px] text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {structures.map((structure) => {
                const isToggling = togglingId === structure.id;

                return (
                  <TableRow key={structure.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{structure.id}</TableCell>
                    <TableCell className="font-medium text-xs">{structure.name}</TableCell>
                    <TableCell className="font-mono text-right text-xs text-muted-foreground">
                      {structure.ruleCount} rules
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          structure.status === "Active"
                            ? "success"
                            : structure.status === "Draft"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px] font-mono"
                      >
                        {structure.status}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right p-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(structure.id)}
                          disabled={isToggling}
                          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : structure.status === "Active" ? (
                            <Archive className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          )}
                          <span>{isToggling ? "Updating..." : structure.status === "Active" ? "Archive" : "Activate"}</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Form - Only visible to HR_PAYROLL_MANAGER and ADMIN */}
        {canEdit && (
          <div>
            <Card>
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                  New Salary Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <SalaryStructureForm
                  onSuccess={handleCreated}
                  onSave={async (data) => {
                    if (!rules.length) throw new Error("Create salary rules before creating a structure");
                    const saved = await createPayrollStructureAction({ name: data.name, code: data.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 30), description: "Created from PeoplePay360 payroll UI", rules: rules.slice(0, 10).map((rule, index) => ({ salaryRuleId: rule.id, sequence: (index + 1) * 10 })) });
                    if (!saved.success) throw new Error(saved.error);
                    const loaded = await listPayrollStructuresAction();
                    setStructures((loaded as any[]).map((structure) => ({ id: structure.id, name: structure.name, ruleCount: structure.rules?.length ?? 0, status: structure.status === "ACTIVE" ? "Active" : structure.status === "DRAFT" ? "Draft" : "Archived" })));
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
