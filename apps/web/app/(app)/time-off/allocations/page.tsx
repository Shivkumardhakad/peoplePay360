"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

const MOCK_ALLOCATIONS = [
  { id: "ALL-001", employee: "Alice Johnson", type: "Annual Leave", allocated: 20, used: 5 },
  { id: "ALL-002", employee: "Bob Smith", type: "Annual Leave", allocated: 20, used: 20 },
  { id: "ALL-003", employee: "Charlie Davis", type: "Sick Leave", allocated: 10, used: 1 },
];

export default function TimeOffAllocationsPage() {
  const [search, setSearch] = useState("");

  const filteredAllocations = MOCK_ALLOCATIONS.filter(a => 
    a.employee.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Off Allocations</h1>
          <p className="text-sm text-muted-foreground">View employee leave balances, consumption, and remaining days.</p>
        </div>
      </div>

      {/* Glass Filter Bar */}
      <div className="p-4 pp-glass flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by employee or leave type..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/80" 
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredAllocations.length}</span> allocation records
        </div>
      </div>

      {/* Solid Surface Table */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead>Alloc Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Used</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAllocations.map((alloc) => {
              const remaining = alloc.allocated - alloc.used;
              return (
                <TableRow key={alloc.id} className="hover:bg-muted/50 border-b border-border/60">
                  <TableCell className="font-mono text-xs text-muted-foreground">{alloc.id}</TableCell>
                  <TableCell className="font-medium text-foreground">{alloc.employee}</TableCell>
                  <TableCell>{alloc.type}</TableCell>
                  <TableCell className="font-mono text-right text-muted-foreground">{alloc.allocated} Days</TableCell>
                  <TableCell className="font-mono text-right text-muted-foreground">{alloc.used} Days</TableCell>
                  <TableCell className={`font-mono text-right font-bold ${remaining === 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {remaining} Days
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
