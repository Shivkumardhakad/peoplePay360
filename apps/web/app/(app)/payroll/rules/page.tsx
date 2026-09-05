"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalaryRuleForm } from "@/components/salary-rule-form";

const MOCK_RULES = [
  { id: "RUL-001", name: "Basic Salary", code: "BASIC", category: "BASIC", sequence: 10, type: "FIXED" },
  { id: "RUL-002", name: "Housing Allowance", code: "HRA", category: "ALLOWANCE", sequence: 20, type: "PERCENTAGE" },
  { id: "RUL-003", name: "Gross Salary", code: "GROSS", category: "GROSS", sequence: 100, type: "SUM" },
];

export default function SalaryRulesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salary Rules</h1>
          <p className="text-sm text-muted-foreground">Define earnings, allowances, deductions, and gross/net calculation logic.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 pp-solid-surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/20">
                <TableHead className="w-[80px]">Seq</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Calc Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RULES.map((rule) => (
                <TableRow key={rule.id} className="hover:bg-muted/50 border-b border-border/60">
                  <TableCell className="font-mono text-xs text-muted-foreground">{rule.sequence}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-foreground">{rule.code}</TableCell>
                  <TableCell className="font-medium text-foreground">{rule.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{rule.category}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {rule.type}
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
              <CardTitle className="text-base font-semibold">Create Salary Rule</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <SalaryRuleForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
