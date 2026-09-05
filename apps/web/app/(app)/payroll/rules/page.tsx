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
          <p className="text-sm text-muted-foreground">Define calculation components for payroll.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sequence</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_RULES.map((rule) => (
                <TableRow key={rule.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-mono text-xs">{rule.sequence}</TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{rule.code}</TableCell>
                  <TableCell className="font-medium text-foreground">{rule.name}</TableCell>
                  <TableCell>{rule.category}</TableCell>
                  <TableCell>{rule.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Rule</CardTitle>
            </CardHeader>
            <CardContent>
              <SalaryRuleForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
