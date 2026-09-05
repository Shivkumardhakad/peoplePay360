"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Clock } from "lucide-react";
import { AttendanceForm } from "@/components/attendance-form";

const MOCK_ATTENDANCE = [
  { id: "ATT-001", employee: "Alice Johnson", date: "2023-10-01", checkIn: "08:55", checkOut: "17:05", workedHours: "8.16", status: "Present" },
  { id: "ATT-002", employee: "Bob Smith", date: "2023-10-01", checkIn: "09:15", checkOut: "17:00", workedHours: "7.75", status: "Late" },
  { id: "ATT-003", employee: "Charlie Davis", date: "2023-10-01", checkIn: "-", checkOut: "-", workedHours: "0.00", status: "Absent" },
];

export default function AttendancePage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredAttendance = MOCK_ATTENDANCE.filter(r => 
    r.employee.toLowerCase().includes(search.toLowerCase()) ||
    r.date.includes(search) ||
    r.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Monitor employee presence, check-in times, and total working hours.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="pp-solid-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manual Attendance Record</DialogTitle>
            </DialogHeader>
            <AttendanceForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar as Glass */}
      <div className="p-4 pp-glass flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by employee, date, or status..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/80" 
          />
        </div>
        <div className="text-xs font-mono text-muted-foreground">
          Showing <span className="font-bold text-foreground">{filteredAttendance.length}</span> attendance entries
        </div>
      </div>

      {/* Solid Surface Table */}
      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/20">
              <TableHead>Ref ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead className="text-right">Worked Hours</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendance.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/50 border-b border-border/60">
                <TableCell className="font-mono text-xs text-muted-foreground">{record.id}</TableCell>
                <TableCell className="font-medium text-foreground">{record.employee}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{record.date}</TableCell>
                <TableCell className="font-mono text-xs">{record.checkIn}</TableCell>
                <TableCell className="font-mono text-xs">{record.checkOut}</TableCell>
                <TableCell className="font-mono text-xs text-right font-medium">{record.workedHours}h</TableCell>
                <TableCell className="text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                    record.status === 'Present' ? 'bg-success/10 text-success' : 
                    record.status === 'Absent' ? 'bg-destructive/10 text-destructive' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {record.status}
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
