import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

const MOCK_REQUESTS = [
  { id: "REQ-001", employee: "Alice Johnson", type: "Annual Leave", dates: "2023-11-20 to 2023-11-24", duration: "5 Days", status: "Pending" },
  { id: "REQ-002", employee: "Bob Smith", type: "Sick Leave", dates: "2023-10-15", duration: "1 Day", status: "Approved" },
  { id: "REQ-003", employee: "Charlie Davis", type: "Unpaid Leave", dates: "2023-09-01", duration: "1 Day", status: "Rejected" },
];

export default function TimeOffRequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Off Requests</h1>
          <p className="text-sm text-muted-foreground">Manage and review employee leave requests.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search requests..." className="pl-9" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_REQUESTS.map((req) => (
              <TableRow key={req.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-foreground">{req.employee}</TableCell>
                <TableCell>{req.type}</TableCell>
                <TableCell className="font-mono text-xs">{req.dates}</TableCell>
                <TableCell className="font-mono text-xs">{req.duration}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    req.status === 'Approved' ? 'bg-success/10 text-success' : 
                    req.status === 'Rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {req.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {req.status === 'Pending' && (
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-destructive hover:text-destructive">Reject</Button>
                      <Button size="sm" className="h-8 bg-success hover:bg-success/90 text-success-foreground">Approve</Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
