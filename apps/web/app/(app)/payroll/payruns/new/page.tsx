"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ArrowRight, ArrowLeft } from "lucide-react";

const MOCK_ELIGIBLE_EMPLOYEES = [
  { id: "EMP-001", name: "Alice Johnson", department: "Engineering", wage: 120000 },
  { id: "EMP-002", name: "Bob Smith", department: "HR", wage: 95000 },
];

export default function NewPayrunWizard() {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Payrun</h1>
        <p className="text-sm text-muted-foreground">Setup and process a new payroll batch.</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</div>
          <span className="font-medium">Setup</span>
        </div>
        <div className="h-px bg-border flex-1 mx-4"></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</div>
          <span className="font-medium">Select Employees</span>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Payrun Details</CardTitle>
            <CardDescription>Select the structure and period for this payrun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="structure">Salary Structure</Label>
              <select 
                id="structure" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="STR-001">Standard Tech Package</option>
                <option value="STR-002">Executive Package</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start</Label>
                <Input id="periodStart" type="date" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input id="periodEnd" type="date" className="font-mono" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => setStep(2)} className="gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Eligible Employees</CardTitle>
            <CardDescription>Select the employees to include in this payrun.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Base Wage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ELIGIBLE_EMPLOYEES.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                    </TableCell>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ${emp.wage.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {/* The single primary action of the wizard that commits the creation */}
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Create Payrun
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
