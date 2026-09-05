import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Filter } from "lucide-react";
import { AttendanceForm } from "@/components/attendance-form";

const MOCK_ATTENDANCE = [
  { id: "ATT-001", employee: "Alice Johnson", date: "2023-10-01", checkIn: "08:55", checkOut: "17:05", workedHours: "8.16", status: "Present" },
  { id: "ATT-002", employee: "Bob Smith", date: "2023-10-01", checkIn: "09:15", checkOut: "17:00", workedHours: "7.75", status: "Late" },
  { id: "ATT-003", employee: "Charlie Davis", date: "2023-10-01", checkIn: "-", checkOut: "-", workedHours: "0.00", status: "Absent" },
];

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">Monitor employee attendance and timesheets.</p>
        </div>
        
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Manual Entry
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search attendance..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter Date
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead className="text-right">Worked Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_ATTENDANCE.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-foreground">{record.employee}</TableCell>
                <TableCell className="font-mono text-xs">{record.date}</TableCell>
                <TableCell className="font-mono text-xs">{record.checkIn}</TableCell>
                <TableCell className="font-mono text-xs">{record.checkOut}</TableCell>
                <TableCell className="font-mono text-xs text-right font-medium">{record.workedHours}h</TableCell>
                <TableCell>
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
