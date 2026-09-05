"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, FileText } from "lucide-react";
import { ContractForm } from "@/components/contract-form";

const MOCK_CONTRACTS = [
  { id: "CON-1001", employee: "Alice Johnson", position: "Senior Frontend Engineer", department: "Engineering", startDate: "2023-01-15", endDate: "-", wage: 120000, status: "Active" },
  { id: "CON-1002", employee: "Bob Smith", position: "HR Manager", department: "HR", startDate: "2021-06-01", endDate: "-", wage: 95000, status: "Active" },
  { id: "CON-1003", employee: "Charlie Davis", position: "Payroll Specialist", department: "Finance", startDate: "2022-03-10", endDate: "2023-12-31", wage: 75000, status: "Ended" },
];

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredContracts = MOCK_CONTRACTS.filter(c => 
    c.employee.toLowerCase().includes(search.toLowerCase()) ||
    c.position.toLowerCase().includes(search.toLowerCase()) ||
    c.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground">Manage employee terms, compensation, and active contracts.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="pp-solid-surface sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Employment Contract</DialogTitle>
            </DialogHeader>
            <ContractForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter bar as glass */}
      <div className="p-4 pp-glass flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search contracts..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/80" 
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredContracts.length}</span> contract records
        </div>
      </div>

      {/* Solid Surface Table */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead>Contract Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Wage</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.map((contract) => (
              <TableRow 
                key={contract.id} 
                className={`hover:bg-muted/50 border-b border-border/60 ${contract.status === 'Active' ? 'border-l-4 border-l-success' : ''}`}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">{contract.id}</TableCell>
                <TableCell className="font-medium text-foreground">{contract.employee}</TableCell>
                <TableCell>{contract.position}</TableCell>
                <TableCell>{contract.department}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{contract.startDate}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{contract.endDate}</TableCell>
                <TableCell className="font-mono text-right font-medium">
                  ${contract.wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
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
