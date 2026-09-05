import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeOffTypeForm } from "@/components/time-off-type-form";

const MOCK_TYPES = [
  { id: "TYP-001", name: "Annual Leave", unit: "Days", requiresApproval: true, isPaid: true },
  { id: "TYP-002", name: "Sick Leave", unit: "Days", requiresApproval: false, isPaid: true },
  { id: "TYP-003", name: "Unpaid Leave", unit: "Days", requiresApproval: true, isPaid: false },
];

export default function TimeOffTypesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Off Types</h1>
          <p className="text-sm text-muted-foreground">Configure leave policies and rules.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Requires Approval</TableHead>
                <TableHead>Is Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_TYPES.map((type) => (
                <TableRow key={type.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-medium text-foreground">{type.name}</TableCell>
                  <TableCell>{type.unit}</TableCell>
                  <TableCell>{type.requiresApproval ? "Yes" : "No"}</TableCell>
                  <TableCell>{type.isPaid ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create Leave Type</CardTitle>
            </CardHeader>
            <CardContent>
              <TimeOffTypeForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
