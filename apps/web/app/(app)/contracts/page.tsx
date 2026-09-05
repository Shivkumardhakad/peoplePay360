import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { ContractForm } from "@/components/contract-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// We'll stub the Dialog component if it wasn't installed fully, 
// but assuming we are using standard shadcn structure.

const MOCK_CONTRACTS = [
  { id: "CON-1001", employee: "Alice Johnson", position: "Senior Frontend Engineer", department: "Engineering", startDate: "2023-01-15", endDate: "-", wage: 120000, status: "Active" },
  { id: "CON-1002", employee: "Bob Smith", position: "HR Manager", department: "HR", startDate: "2021-06-01", endDate: "-", wage: 95000, status: "Active" },
  { id: "CON-1003", employee: "Charlie Davis", position: "Payroll Specialist", department: "Finance", startDate: "2022-03-10", endDate: "2023-12-31", wage: 75000, status: "Ended" },
];

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground">Manage employee employment terms and compensation.</p>
        </div>
        
        {/* We use a simple button here. In a real app this might open a dialog or navigate to a new page */}
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Contract
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contracts..." className="pl-9" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Wage</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CONTRACTS.map((contract) => (
              <TableRow 
                key={contract.id} 
                className={`cursor-pointer hover:bg-muted/50 ${contract.status === 'Active' ? 'border-l-4 border-l-success' : ''}`}
              >
                <TableCell className="font-medium text-foreground">{contract.employee}</TableCell>
                <TableCell>{contract.position}</TableCell>
                <TableCell>{contract.department}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{contract.startDate}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{contract.endDate}</TableCell>
                <TableCell className="font-mono text-right font-medium">
                  ${contract.wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    contract.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {contract.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
