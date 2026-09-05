"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { SalaryRuleForm, type SalaryRuleFormValues } from "@/components/salary-rule-form";
import { Sparkles, Trash2, Loader2, Lock } from "lucide-react";

interface RuleItem {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  type: string;
}

const INITIAL_RULES: RuleItem[] = [
  { id: "RUL-001", name: "Basic Salary", code: "BASIC", category: "BASIC", sequence: 10, type: "FIXED" },
  { id: "RUL-002", name: "Housing Allowance", code: "HRA", category: "ALLOWANCE", sequence: 20, type: "PERCENTAGE" },
  { id: "RUL-003", name: "Provident Fund", code: "PF", category: "DEDUCTION", sequence: 30, type: "PERCENTAGE" },
  { id: "RUL-004", name: "Gross Salary", code: "GROSS", category: "GROSS", sequence: 100, type: "SUM" },
  { id: "RUL-005", name: "Net Salary Payable", code: "NET", category: "NET", sequence: 200, type: "SUM" },
];

export default function SalaryRulesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [rules, setRules] = useState<RuleItem[]>(INITIAL_RULES);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const role = session?.user?.role || "ADMIN";
  const canEdit =
    role === "ADMIN" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER";

  const handleRuleCreated = (data: SalaryRuleFormValues) => {
    const newRule: RuleItem = {
      id: `RUL-${String(rules.length + 1).padStart(3, "0")}`,
      name: data.name,
      code: data.code.toUpperCase(),
      category: data.category,
      sequence: Number(data.sequence),
      type: data.calculationType,
    };
    const sorted = [...rules, newRule].sort((a, b) => a.sequence - b.sequence);
    setRules(sorted);
  };

  const handleDeleteRule = async (id: string, name: string) => {
    setDeletingId(id);
    await new Promise((r) => setTimeout(r, 450));
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
    toast({
      title: "Rule Removed",
      description: `Rule ${name} (${id}) has been removed.`,
      type: "info",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-base font-semibold tracking-tight text-foreground">Salary Rules</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Ordered salary calculation logic executed sequentially for payslip line generation.
          </p>
        </div>
        {!canEdit && (
          <Badge variant="outline" className="text-[10px] font-mono gap-1 text-muted-foreground">
            <Lock className="w-3 h-3" />
            Read-Only (Requires HR Payroll Manager)
          </Badge>
        )}
      </div>

      <div className={`grid grid-cols-1 ${canEdit ? "lg:grid-cols-3" : "grid-cols-1"} gap-3 items-start`}>
        {/* Rules Table */}
        <div className={`${canEdit ? "lg:col-span-2" : "col-span-1"} rounded-lg border border-border bg-card overflow-hidden`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Seq</TableHead>
                <TableHead className="w-[85px]">Code</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Method</TableHead>
                {canEdit && <TableHead className="w-[60px] text-right"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => {
                const isDeleting = deletingId === rule.id;

                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{rule.sequence}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">{rule.code}</TableCell>
                    <TableCell className="font-medium text-xs">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {rule.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {rule.type}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right p-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          disabled={isDeleting}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Rule Form Card */}
        {canEdit && (
          <div>
            <Card>
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">
                  New Salary Rule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <SalaryRuleForm onSuccess={handleRuleCreated} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
