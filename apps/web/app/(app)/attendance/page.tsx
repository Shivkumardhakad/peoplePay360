"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { quickCheckInAction, getAttendanceAction } from "@/lib/api-actions";
import { AttendanceForm, type AttendanceFormValues } from "@/components/attendance-form";
import { Plus, Search, LogIn, LogOut, Loader2, LayoutList, Kanban, Clock, Calendar } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    getAttendanceAction().then((live) => {
      if (live && live.length > 0) {
        setAttendance(live);
      }
    });
  }, []);

  const role = String(session?.user?.role || "ADMIN");
  const isEmployee = role === "EMPLOYEE";
  const canAddManual =
    role === "ADMIN" ||
    role === "HR_MANAGER" ||
    role === "HR_PAYROLL_MANAGER" ||
    role === "PAYROLL_MANAGER" ||
    role === "HR_PAYROLL_USER";
  const currentUserName = session?.user?.name || "Emily Watson";

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

    const empId = session?.user?.employeeId || session?.user?.id || "EMP-001";
    const timeParts = new Date().toTimeString().split(" ");
    const timeNow = (timeParts[0] || "09:00").slice(0, 5);

    try {
      const res = await quickCheckInAction(empId, type);
      if (res.success) {
        toast({
          title: type === "IN" ? "Checked In" : "Checked Out",
          description: `Logged at ${timeNow} today.`,
          type: "success",
        });
        const live = await getAttendanceAction();
        if (live && live.length > 0) {
          setAttendance(live);
        }
      } else {
        toast({
          title: "Attendance error",
          description: res.error || "Could not log attendance",
          type: "error",
        });
      }
    } catch {
      toast({
        title: "Check-in Error",
        description: "Failed to record attendance state.",
        type: "error",
      });
    } finally {
      if (type === "IN") setCheckingIn(false);
      else setCheckingOut(false);
    }
  };

  const handleManualCreated = async () => {
    const live = await getAttendanceAction();
    if (live && live.length > 0) {
      setAttendance(live);
    }
    setDialogOpen(false);
  };

  const isAnyProcessing = checkingIn || checkingOut;

  const presentRecords = filteredAttendance.filter((r) => r.status === "Present");
  const lateRecords = filteredAttendance.filter((r) => r.status === "Late");
  const halfDayRecords = filteredAttendance.filter((r) => r.status === "Half Day");
  const absentRecords = filteredAttendance.filter((r) => r.status === "Absent");

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
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="w-3.5 h-3.5" />
              List
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("kanban")}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </Button>
          </div>

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

      {/* Content View */}
      {viewMode === "list" ? (
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
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Present */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Present ({presentRecords.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {presentRecords.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No present logs.
                </div>
              ) : (
                presentRecords.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-emerald-500/40 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-foreground">{r.employee}</h4>
                      <Badge variant="success" className="text-[10px] font-mono shrink-0">
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" /> {r.checkIn} - {r.checkOut}
                      </span>
                      <span className="font-semibold text-foreground">{r.workedHours}h</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {r.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Late */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Late Arrival ({lateRecords.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {lateRecords.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No late logs.
                </div>
              ) : (
                lateRecords.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-amber-500/40 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-foreground">{r.employee}</h4>
                      <Badge variant="warning" className="text-[10px] font-mono shrink-0">
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> {r.checkIn} - {r.checkOut}
                      </span>
                      <span className="font-semibold text-foreground">{r.workedHours}h</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {r.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Half Day */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Half Day ({halfDayRecords.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {halfDayRecords.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No half day logs.
                </div>
              ) : (
                halfDayRecords.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-blue-500/40 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-foreground">{r.employee}</h4>
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> {r.checkIn} - {r.checkOut}
                      </span>
                      <span className="font-semibold text-foreground">{r.workedHours}h</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {r.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Absent */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Absent ({absentRecords.length})
                </h3>
              </div>
            </div>
            <div className="space-y-2.5">
              {absentRecords.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                  No absent logs.
                </div>
              ) : (
                absentRecords.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg border border-border/80 bg-card hover:border-rose-500/40 transition-all space-y-2 opacity-85">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-foreground">{r.employee}</h4>
                      <Badge variant="destructive" className="text-[10px] font-mono shrink-0">
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-rose-500" /> No Check-in
                      </span>
                      <span className="font-semibold text-foreground">0.00h</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {r.date}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
