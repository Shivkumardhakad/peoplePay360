"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

const MOCK_ELIGIBLE_EMPLOYEES = [
  { id: "EMP-001", name: "Alice Johnson", department: "Engineering", wage: 120000 },
  { id: "EMP-002", name: "Bob Smith", department: "HR", wage: 95000 },
  { id: "EMP-003", name: "Charlie Davis", department: "Finance", wage: 75000 },
];

export default function NewPayrunWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(["EMP-001", "EMP-002"]);

  const toggleEmployee = (id: string) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(e => e !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  const handleCreatePayrun = () => {
    // Navigate to payrun processing page
    router.push("/payroll/payruns/PR-2023-11");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Payrun</h1>
        <p className="text-sm text-muted-foreground">Setup and process a new payroll processing batch.</p>
      </div>

      {/* Wizard Steps Indicator as Glass */}
      <div className="p-4 pp-glass flex items-center justify-around">
        <div className={`flex items-center gap-3 ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="font-medium text-sm">Batch Setup</span>
        </div>
        <div className="h-px bg-border flex-1 mx-8"></div>
        <div className={`flex items-center gap-3 ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span className="font-medium text-sm">Select Employees ({selectedEmployees.length})</span>
        </div>
      </div>

      {step === 1 && (
        <Card className="pp-solid-surface">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Step 1: Payrun Parameters</CardTitle>
            <CardDescription>Select the applicable salary structure and target payroll date range.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="structure">Salary Structure</Label>
              <select 
                id="structure" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="STR-001">Standard Tech Package</option>
                <option value="STR-002">Executive Package</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start Date</Label>
                <Input id="periodStart" type="date" defaultValue="2023-11-01" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End Date</Label>
                <Input id="periodEnd" type="date" defaultValue="2023-11-30" className="font-mono text-sm" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border pt-4">
            <Button onClick={() => setStep(2)} className="gap-2">
              Continue to Employee Selection <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card className="pp-solid-surface">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-lg">Step 2: Eligible Employees</CardTitle>
            <CardDescription>Select which active employees should be included in this payrun batch.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/20">
                  <TableHead className="w-12 text-center">Include</TableHead>
                  <TableHead>Emp Ref</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Annual Base Wage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ELIGIBLE_EMPLOYEES.map((emp) => {
                  const isChecked = selectedEmployees.includes(emp.id);
                  return (
                    <TableRow key={emp.id} className="hover:bg-muted/50 border-b border-border/60">
                      <TableCell className="text-center">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => toggleEmployee(emp.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer" 
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{emp.id}</TableCell>
                      <TableCell className="font-medium text-foreground">{emp.name}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-medium">
                        ${emp.wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border p-4">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Setup
            </Button>
            {/* The single primary gold accent action button */}
            <Button onClick={handleCreatePayrun} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <CheckCircle className="w-4 h-4" />
              Create Payrun
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
