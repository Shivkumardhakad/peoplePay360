"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { createPayrunAction, listPayrollStructuresAction } from "@/lib/api-actions";
import { getPayrollEligibleEmployeesAction } from "@/lib/api-actions";

export default function NewPayrunWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [structureId, setStructureId] = useState("");
  const [periodStart, setPeriodStart] = useState("2026-09-01");
  const [periodEnd, setPeriodEnd] = useState("2026-09-30");

  useEffect(() => {
    Promise.all([getPayrollEligibleEmployeesAction(), listPayrollStructuresAction()]).then(([loadedEmployees, loadedStructures]) => {
      setEmployees(loadedEmployees);
      setSelectedEmployees(loadedEmployees.map((employee) => employee.id));
      setStructures(loadedStructures as any[]);
      setStructureId((loadedStructures as any[])[0]?.id ?? "");
    }).catch((error) => toast({ title: "Unable to load payrun setup", description: error.message, type: "error" }));
  }, [toast]);

  const toggleEmployee = (id: string) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter((e) => e !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  const handleCreatePayrun = async () => {
    setIsCreating(true);
    try {
      if (!structureId || !selectedEmployees.length) throw new Error("Select a salary structure and at least one employee.");
      const created = await createPayrunAction({ name: `Payroll ${periodStart} to ${periodEnd}`, periodStart: `${periodStart}T00:00:00`, periodEnd: `${periodEnd}T23:59:59`, salaryStructureId: structureId, selectedEmployeeIds: selectedEmployees });
      toast({ title: "Payrun Batch Initialized", description: "Payrun created in the Java Payroll API.", type: "success" });
      router.push(`/payroll/payruns/${(created as any).id}`);
    } catch (error) {
      toast({ title: "Payrun creation failed", description: error instanceof Error ? error.message : "Payroll API request failed.", type: "error" });
    } finally { setIsCreating(false); }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-base font-semibold tracking-tight text-foreground">Create Payrun</h1>
        <p className="text-xs text-muted-foreground">Setup and batch calculate a monthly payroll cycle.</p>
      </div>

      {/* Stepper Header */}
      <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-around">
        <div className={`flex items-center gap-2 ${step >= 1 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
            step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            1
          </div>
          <span className="text-xs">Batch Parameters</span>
        </div>
        <div className="h-[1px] bg-border flex-1 mx-6" />
        <div className={`flex items-center gap-2 ${step >= 2 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
            step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            2
          </div>
          <span className="text-xs">Select Employees ({selectedEmployees.length})</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle>Step 1: Payrun Parameters</CardTitle>
            <CardDescription>Select the applicable salary structure and date period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="structure" className="text-xs font-medium">Salary Structure</Label>
              <select
                id="structure"
                value={structureId}
                onChange={(event) => setStructureId(event.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {structures.map((structure) => <option key={structure.id} value={structure.id}>{structure.name} ({structure.code})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <div className="space-y-1.5">
                <Label htmlFor="periodStart" className="text-xs font-medium">Start Date</Label>
                <Input id="periodStart" type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="font-mono text-xs h-8" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="periodEnd" className="text-xs font-medium">End Date</Label>
                <Input id="periodEnd" type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="font-mono text-xs h-8" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border pt-3">
            <Button size="sm" onClick={() => setStep(2)} className="gap-1.5 h-8">
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="border-b border-border pb-3">
            <CardTitle>Step 2: Eligible Employees</CardTitle>
            <CardDescription>Select active employees with active contracts in the target period.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center"></TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Base Wage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const isChecked = selectedEmployees.includes(emp.id);
                  return (
                    <TableRow key={emp.id} className="hover:bg-muted/40">
                      <TableCell className="text-center p-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEmployee(emp.id)}
                          className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-xs">{emp.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{emp.department}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        ${emp.wage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border p-3">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={isCreating} className="gap-1.5 h-8">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <Button size="sm" onClick={handleCreatePayrun} disabled={isCreating} className="gap-1.5 h-8">
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Batch...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Create Payrun</span>
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
