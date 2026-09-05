"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { ContractForm, type ContractFormValues } from "@/components/contract-form";
import { getContractsAction } from "@/lib/api-actions";

interface ContractItem {
  id: string;
  employee: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  wage: number;
  status: "Active" | "Ended";
}

export default function ContractsPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getContractsAction().then((liveContracts) => {
      setContracts(liveContracts);
    });
  }, []);

  const role = session?.user?.role || "ADMIN";
  const canCreateContract =
    role === "ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER" ||
    role === "HR_PAYROLL_USER";

  const filteredContracts = contracts.filter(
    (c) =>
      c.employee.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreated = async () => {
    const live = await getContractsAction();
    setContracts(live);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Contracts</h1>
          <p className="text-xs text-muted-foreground">Employment terms, compensation, and active ledger ties.</p>
        </div>

        {canCreateContract && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8">
                <Plus className="w-3.5 h-3.5" />
                Create Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Employment Contract</DialogTitle>
              </DialogHeader>
              <ContractForm onSuccess={handleCreated} onCancel={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredContracts.length} records
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Ref ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Term</TableHead>
              <TableHead className="text-right">Base Wage</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                  No contracts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{contract.id}</TableCell>
                  <TableCell className="font-medium text-xs">{contract.employee}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{contract.position}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{contract.department}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">
                    {contract.startDate} → {contract.endDate}
                  </TableCell>
                  <TableCell className="font-mono text-right text-xs font-semibold">
                    ${contract.wage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={contract.status === "Active" ? "success" : "secondary"}
                      className="text-[10px] font-mono"
                    >
                      {contract.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
