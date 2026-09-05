"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Search, Plus, Loader2 } from "lucide-react";
import { getAllocationsAction } from "@/lib/api-actions";

interface AllocationItem {
  id: string;
  employee: string;
  type: string;
  allocated: number;
  used: number;
}

export default function TimeOffAllocationsPage() {
  const { toast } = useToast();
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [employee, setEmployee] = useState("Alice Johnson");
  const [leaveType, setLeaveType] = useState("Annual Leave");
  const [allocatedDays, setAllocatedDays] = useState(15);

  useEffect(() => { getAllocationsAction().then((rows) => setAllocations(rows)); }, []);

  const filteredAllocations = allocations.filter(
    (a) =>
      a.employee.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleGrantAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));

    const newAlloc: AllocationItem = {
      id: `ALL-${String(allocations.length + 1).padStart(3, "0")}`,
      employee,
      type: leaveType,
      allocated: Number(allocatedDays),
      used: 0,
    };

    setAllocations([newAlloc, ...allocations]);
    setSubmitting(false);
    setDialogOpen(false);

    toast({
      title: "Allocation Granted",
      description: `${allocatedDays} days of ${leaveType} allocated to ${employee}.`,
      type: "success",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">Time Off Allocations</h1>
          <p className="text-xs text-muted-foreground">Manage employee leave entitlements, consumption, and balances.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              Grant Allocation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Grant Leave Entitlement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGrantAllocation} className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="allocEmployee" className="text-xs font-medium">Employee</Label>
                <select
                  id="allocEmployee"
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Alice Johnson">Alice Johnson (EMP-001)</option>
                  <option value="Bob Smith">Bob Smith (EMP-002)</option>
                  <option value="Charlie Davis">Charlie Davis (EMP-003)</option>
                  <option value="Emily Watson">Emily Watson (EMP-004)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="allocType" className="text-xs font-medium">Leave Policy</Label>
                  <select
                    id="allocType"
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Absence">Casual Absence</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="allocDays" className="text-xs font-medium">Days Allocated</Label>
                  <Input
                    id="allocDays"
                    type="number"
                    min="1"
                    max="60"
                    value={allocatedDays}
                    onChange={(e) => setAllocatedDays(Number(e.target.value))}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 h-8">
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? "Allocating..." : "Grant Allocation"}</span>
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter allocations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredAllocations.length} records
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[95px]">Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Consumed</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                  No allocation records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAllocations.map((alloc) => {
                const remaining = alloc.allocated - alloc.used;
                return (
                  <TableRow key={alloc.id}>
                    <TableCell className="font-mono text-[11px] text-muted-foreground">{alloc.id}</TableCell>
                    <TableCell className="font-medium text-xs">{alloc.employee}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{alloc.type}</TableCell>
                    <TableCell className="font-mono text-right text-xs text-muted-foreground">
                      {alloc.allocated} d
                    </TableCell>
                    <TableCell className="font-mono text-right text-xs text-muted-foreground">
                      {alloc.used} d
                    </TableCell>
                    <TableCell
                      className={`font-mono text-right text-xs font-semibold ${
                        remaining === 0 ? "text-rose-600" : "text-foreground"
                      }`}
                    >
                      {remaining} d
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={remaining === 0 ? "destructive" : remaining < 5 ? "warning" : "success"}
                        className="text-[10px] font-mono"
                      >
                        {remaining === 0 ? "Exhausted" : remaining < 5 ? "Low Balance" : "Available"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
