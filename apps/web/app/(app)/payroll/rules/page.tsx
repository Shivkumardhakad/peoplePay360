"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { SalaryRuleForm, type SalaryRuleFormValues } from "@/components/salary-rule-form";
import { Sparkles, Trash2, Loader2, Lock } from "lucide-react";
import { createPayrollCategoryAction, createPayrollRuleAction, deactivatePayrollRuleAction, deletePayrollCategoryAction, listPayrollCategoriesAction, listPayrollRulesAction, updatePayrollCategoryAction } from "@/lib/api-actions";

interface RuleItem {
  id: string;
  name: string;
  code: string;
  category: string;
  sequence: number;
  type: string;
}


export default function SalaryRulesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryType, setCategoryType] = useState("EARNING");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const role = session?.user?.role || "ADMIN";
  const canEdit =
    role === "ADMIN" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER";

  useEffect(() => {
    Promise.all([listPayrollRulesAction(), listPayrollCategoriesAction()]).then(([loadedRules, loadedCategories]) => {
      setCategories(loadedCategories as any[]);
      setRules((loadedRules as any[]).map((rule) => ({ ...rule, category: (loadedCategories as any[]).find((category) => category.id === rule.categoryId)?.code ?? rule.categoryId, type: rule.calculationType })));
    }).catch((error) => toast({ title: "Payroll API unavailable", description: error.message, type: "error" }));
  }, [toast]);

  const handleRuleCreated = (data: SalaryRuleFormValues) => {
    void data;
  };

  const handleDeleteRule = async (id: string, name: string) => {
    setDeletingId(id);
    await deactivatePayrollRuleAction(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
    toast({
      title: "Rule Removed",
      description: `Rule ${name} (${id}) has been removed.`,
      type: "info",
    });
  };

  const saveCategory = async () => {
    const body = { name: categoryName, ...(editingCategoryId ? {} : { code: categoryCode }), type: categoryType, description: categoryDescription };
    const result = editingCategoryId ? await updatePayrollCategoryAction(editingCategoryId, body) : await createPayrollCategoryAction(body);
    if (!result.success) { toast({ title: "Category save failed", description: result.error, type: "error" }); return; }
    const loaded = await listPayrollCategoriesAction(); setCategories(loaded as any[]); setCategoryName(""); setCategoryCode(""); setCategoryDescription(""); setEditingCategoryId(null); toast({ title: editingCategoryId ? "Category updated" : "Category created", type: "success" });
  };

  const removeCategory = async (id: string) => {
    const result = await deletePayrollCategoryAction(id);
    if (!result.success) { toast({ title: "Category delete failed", description: result.error, type: "error" }); return; }
    setCategories((current) => current.filter((category) => category.id !== id));
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
                <SalaryRuleForm
                  onSuccess={handleRuleCreated}
                  onSave={async (data) => {
                    const category = categories.find((item) => item.code === data.category);
                    if (!category) throw new Error("Select a valid payroll category");
                    const saved = await createPayrollRuleAction({ name: data.name, code: data.code, categoryId: category.id, sequence: Number(data.sequence), calculationType: data.calculationType, value: data.calculationType === "FIXED" ? data.amount : data.percentage, formula: data.calculationType === "FORMULA" ? data.formula : null });
                    if (!saved.success) throw new Error(saved.error);
                    const loaded = await listPayrollRulesAction();
                    setRules((loaded as any[]).map((rule) => ({ ...rule, category: categories.find((item) => item.id === rule.categoryId)?.code ?? rule.categoryId, type: rule.calculationType })));
                  }}
                />
              </CardContent>
            </Card>
            <Card className="mt-3">
              <CardHeader className="border-b border-border pb-3"><CardTitle className="text-xs font-semibold uppercase tracking-wider font-mono text-muted-foreground">Rule Categories</CardTitle></CardHeader>
              <CardContent className="space-y-2 pt-3">
                <div className="grid grid-cols-2 gap-2"><div><Label className="text-[10px]">Name</Label><Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} className="h-7 text-xs" placeholder="Earnings" /></div><div><Label className="text-[10px]">Code</Label><Input value={categoryCode} disabled={Boolean(editingCategoryId)} onChange={(event) => setCategoryCode(event.target.value.toUpperCase())} className="h-7 text-xs font-mono" placeholder="EARN" /></div></div>
                <div className="grid grid-cols-2 gap-2"><select value={categoryType} onChange={(event) => setCategoryType(event.target.value)} className="h-7 rounded-md border border-input bg-background px-2 text-xs"><option value="EARNING">Earning</option><option value="DEDUCTION">Deduction</option><option value="AGGREGATE">Aggregate</option></select><Input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} className="h-7 text-xs" placeholder="Description" /></div>
                <div className="flex justify-end"><Button size="sm" className="h-7 text-xs" onClick={() => void saveCategory()}>{editingCategoryId ? "Update" : "Add category"}</Button></div>
                <div className="space-y-1">{categories.map((category) => <div key={category.id} className="flex items-center justify-between rounded border px-2 py-1.5 text-[11px]"><span><Badge variant="outline" className="mr-1 text-[9px]">{category.code}</Badge>{category.name}</span><span className="flex gap-1"><Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => { setEditingCategoryId(category.id); setCategoryName(category.name); setCategoryCode(category.code); setCategoryType(category.type); setCategoryDescription(category.description ?? ""); }}>Edit</Button><Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] text-destructive" onClick={() => void removeCategory(category.id)}>Delete</Button></span></div>)}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
