import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

const MOCK_ALLOCATIONS = [
  { id: "ALL-001", employee: "Alice Johnson", type: "Annual Leave", allocated: 20, used: 5 },
  { id: "ALL-002", employee: "Bob Smith", type: "Annual Leave", allocated: 20, used: 20 },
  { id: "ALL-003", employee: "Charlie Davis", type: "Sick Leave", allocated: 10, used: 1 },
];

export default function TimeOffAllocationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Off Allocations</h1>
          <p className="text-sm text-muted-foreground">View employee leave balances and usage.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search allocations..." className="pl-9" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Used</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_ALLOCATIONS.map((alloc) => {
              const remaining = alloc.allocated - alloc.used;
              return (
                <TableRow key={alloc.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">{alloc.employee}</TableCell>
                  <TableCell>{alloc.type}</TableCell>
                  <TableCell className="font-mono text-right text-muted-foreground">{alloc.allocated}</TableCell>
                  <TableCell className="font-mono text-right text-muted-foreground">{alloc.used}</TableCell>
                  <TableCell className={`font-mono text-right font-medium ${remaining === 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {remaining}
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
