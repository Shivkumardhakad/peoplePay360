"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalaryStructureForm } from "@/components/salary-structure-form";

const MOCK_STRUCTURES = [
  { id: "STR-001", name: "Standard Tech Package", ruleCount: 15, status: "Active" },
  { id: "STR-002", name: "Executive Package", ruleCount: 8, status: "Active" },
  { id: "STR-003", name: "Intern Stipend", ruleCount: 3, status: "Draft" },
];

export default function SalaryStructuresPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salary Structures</h1>
          <p className="text-sm text-muted-foreground">Manage collections of salary calculation rules for payroll processing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 pp-solid-surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/20">
                <TableHead>Structure Ref</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Rules Count</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_STRUCTURES.map((structure) => (
                <TableRow key={structure.id} className="hover:bg-muted/50 border-b border-border/60">
                  <TableCell className="font-mono text-xs text-muted-foreground">{structure.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{structure.name}</TableCell>
                  <TableCell className="font-mono text-right font-medium">{structure.ruleCount}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      structure.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {structure.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <Card className="pp-solid-surface">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base font-semibold">New Salary Structure</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SalaryStructureForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
