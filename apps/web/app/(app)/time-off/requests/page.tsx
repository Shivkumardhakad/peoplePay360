"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, CheckCircle, XCircle } from "lucide-react";

const MOCK_REQUESTS = [
  { id: "REQ-001", employee: "Alice Johnson", type: "Annual Leave", dates: "2023-11-20 to 2023-11-24", duration: "5 Days", status: "Pending" },
  { id: "REQ-002", employee: "Bob Smith", type: "Sick Leave", dates: "2023-10-15", duration: "1 Day", status: "Approved" },
  { id: "REQ-003", employee: "Charlie Davis", type: "Unpaid Leave", dates: "2023-09-01", duration: "1 Day", status: "Rejected" },
];

export default function TimeOffRequestsPage() {
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [search, setSearch] = useState("");

  const handleDecision = (id: string, decision: "Approved" | "Rejected") => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: decision } : r));
  };

  const filteredRequests = requests.filter(r => 
    r.employee.toLowerCase().includes(search.toLowerCase()) ||
    r.type.toLowerCase().includes(search.toLowerCase()) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Off Requests</h1>
          <p className="text-sm text-muted-foreground">Review, approve, or reject employee leave applications.</p>
        </div>
      </div>

      {/* Glass Filter Bar */}
      <div className="p-4 pp-glass flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by employee, type, or status..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/80" 
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredRequests.length}</span> leave requests
        </div>
      </div>

      {/* Solid Surface Table */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead>Req Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((req) => (
              <TableRow key={req.id} className="hover:bg-muted/50 border-b border-border/60">
                <TableCell className="font-mono text-xs text-muted-foreground">{req.id}</TableCell>
                <TableCell className="font-medium text-foreground">{req.employee}</TableCell>
                <TableCell>{req.type}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{req.dates}</TableCell>
                <TableCell className="font-mono text-xs font-medium">{req.duration}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    req.status === 'Approved' ? 'bg-success/10 text-success' : 
                    req.status === 'Rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {req.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {req.status === 'Pending' ? (
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDecision(req.id, "Rejected")}
                        className="h-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleDecision(req.id, "Approved")}
                        className="h-8 bg-success text-success-foreground hover:bg-success/90"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">Processed</span>
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
