"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { quickCheckInAction } from "@/lib/api-actions";
import { AttendanceForm, type AttendanceFormValues } from "@/components/attendance-form";
import { Plus, Search, LogIn, LogOut, Loader2 } from "lucide-react";

interface AttendanceRecord {
  id: string;
  employee: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workedHours: string;
  status: "Present" | "Late" | "Absent" | "Half Day";
}

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: "ATT-001", employee: "Alice Johnson", date: "2023-10-01", checkIn: "08:55", checkOut: "17:05", workedHours: "8.16", status: "Present" },
  { id: "ATT-002", employee: "Bob Smith", date: "2023-10-01", checkIn: "09:15", checkOut: "17:00", workedHours: "7.75", status: "Late" },
  { id: "ATT-003", employee: "Charlie Davis", date: "2023-10-01", checkIn: "-", checkOut: "-", workedHours: "0.00", status: "Absent" },
  { id: "ATT-004", employee: "Emily Watson", date: "2023-10-01", checkIn: "09:00", checkOut: "17:30", workedHours: "8.50", status: "Present" },
];

export default function AttendancePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const role = session?.user?.role || "ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const canAddManual =
    role === "ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER" ||
    role === "HR_PAYROLL_USER";
  const currentUserName = session?.user?.name || "Emily Watson";

  // RBAC Scoping: Employees see ONLY their own records. Managers see company-wide records.
  const scopedAttendance = isEmployee
    ? (attendance.some((r) => r.employee.toLowerCase() === currentUserName.toLowerCase())
        ? attendance.filter((r) => r.employee.toLowerCase() === currentUserName.toLowerCase())
        : [
            {
              id: "ATT-MINE",
              employee: currentUserName,
              date: new Date().toISOString().split("T")[0] || "2023-10-01",
              checkIn: "09:00",
              checkOut: "-",
              workedHours: "In Progress",
              status: "Present" as const,
            },
          ])
    : attendance;

  const filteredAttendance = scopedAttendance.filter(
    (r) =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search) ||
      r.status.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleQuickCheck = async (type: "IN" | "OUT") => {
    if (type === "IN") setCheckingIn(true);
    else setCheckingOut(true);

    const empId = session?.user?.employeeId || "EMP-001";
    const empName = session?.user?.name || "Current User";
    const timeParts = new Date().toTimeString().split(" ");
    const timeNow = (timeParts[0] || "09:00").slice(0, 5);
    const todayParts = new Date().toISOString().split("T");
    const today = todayParts[0] || "2023-10-01";

    try {
      await quickCheckInAction(empId, type);
      await new Promise((r) => setTimeout(r, 450)); // perceptible smooth loading feedback

      toast({
        title: type === "IN" ? "Checked In" : "Checked Out",
        description: `Logged at ${timeNow} today.`,
        type: "success",
      });

      if (type === "IN") {
        setAttendance([
          {
            id: `ATT-${String(attendance.length + 1).padStart(3, "0")}`,
            employee: empName,
            date: today,
            checkIn: timeNow,
            checkOut: "-",
            workedHours: "Active",
            status: "Present",
          },
          ...attendance,
        ]);
      } else {
        setAttendance((prev) =>
          prev.map((r, i) => (i === 0 ? { ...r, checkOut: timeNow, workedHours: "8.00" } : r))
        );
      }
    } finally {
      if (type === "IN") setCheckingIn(false);
      else setCheckingOut(false);
    }
  };

  const handleManualCreated = (data: AttendanceFormValues) => {
    const employeeNames: Record<string, string> = {
      "EMP-001": "Alice Johnson",
      "EMP-002": "Bob Smith",
      "EMP-003": "Charlie Davis",
      "EMP-004": "Emily Watson",
    };

    const newRecord: AttendanceRecord = {
      id: `ATT-${String(attendance.length + 1).padStart(3, "0")}`,
      employee: employeeNames[data.employeeId] || data.employeeId,
      date: data.date,
      checkIn: data.checkIn || "-",
      checkOut: data.checkOut || "-",
      workedHours: data.checkIn && data.checkOut ? "8.00" : "0.00",
      status: data.status === "PRESENT" ? "Present" : data.status === "LATE" ? "Late" : data.status === "HALF_DAY" ? "Half Day" : "Absent",
    };

    setAttendance([newRecord, ...attendance]);
    setDialogOpen(false);
  };

  const isAnyProcessing = checkingIn || checkingOut;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            {isEmployee ? "My Attendance" : "Attendance"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEmployee
              ? "Your personal worked duration, check-in history, and presence logs."
              : "Company timesheets, worked duration, and presence logs."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEmployee && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCheck("IN")}
                disabled={isAnyProcessing}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>Logging In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3 h-3 text-emerald-600" />
                    <span>Check-In</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickCheck("OUT")}
                disabled={isAnyProcessing}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    <span>Logging Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3 h-3 text-amber-600" />
                    <span>Check-Out</span>
                  </>
                )}
              </Button>
            </>
          )}

          {canAddManual && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" />
                  Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Manual Attendance Record</DialogTitle>
                </DialogHeader>
                <AttendanceForm onSuccess={handleManualCreated} onCancel={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-2 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter presence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredAttendance.length} entries
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[85px]">Ref</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>In</TableHead>
              <TableHead>Out</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAttendance.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-xs text-muted-foreground">
                  No records.
                </TableCell>
              </TableRow>
            ) : (
              filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{record.id}</TableCell>
                  <TableCell className="font-medium text-xs">{record.employee}</TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{record.date}</TableCell>
                  <TableCell className="font-mono text-[11px]">{record.checkIn}</TableCell>
                  <TableCell className="font-mono text-[11px]">{record.checkOut}</TableCell>
                  <TableCell className="font-mono text-right text-xs font-semibold">{record.workedHours}h</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        record.status === "Present"
                          ? "success"
                          : record.status === "Late"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] font-mono"
                    >
                      {record.status}
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
