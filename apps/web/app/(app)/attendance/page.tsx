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
import { TablePagination } from "@/components/ui/table-pagination";
import { Plus, Search, LogIn, LogOut, Loader2, LayoutList, Kanban, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workedHours: string;
  status: "Present" | "Late" | "Absent" | "Half Day";
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [kanbanPages, setKanbanPages] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    getAttendanceAction().then((live) => {
      setAttendance(live);
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
  const currentUserName = session?.user?.name || "";

  const scopedAttendance = isEmployee
    ? attendance.filter((r) => r.employeeId === session?.user?.employeeId)
    : attendance;

  const filteredAttendance = scopedAttendance.filter(
    (r) =>
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      r.date.includes(search) ||
      r.status.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAttendance.length / pageSize);
  const paginatedAttendance = filteredAttendance.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
    setKanbanPages({});
  };

  const handleQuickCheck = async (type: "IN" | "OUT") => {
    if (type === "IN") setCheckingIn(true);
    else setCheckingOut(true);

    const empId = session?.user?.employeeId || session?.user?.id;
    if (!empId) {
      toast({ title: "Attendance error", description: "Your login is not linked to an employee record.", type: "error" });
      if (type === "IN") setCheckingIn(false);
      else setCheckingOut(false);
      return;
    }
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
        setAttendance(live);
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

  const kanbanColumns = [
    { key: "Present", title: "Present", records: presentRecords, color: "bg-emerald-500", hoverColor: "hover:border-emerald-500/40", badgeVariant: "success" as const, clockColor: "text-emerald-500" },
    { key: "Late", title: "Late Arrival", records: lateRecords, color: "bg-amber-500", hoverColor: "hover:border-amber-500/40", badgeVariant: "warning" as const, clockColor: "text-amber-500" },
    { key: "Half Day", title: "Half Day", records: halfDayRecords, color: "bg-blue-500", hoverColor: "hover:border-blue-500/40", badgeVariant: "outline" as const, clockColor: "text-blue-500" },
    { key: "Absent", title: "Absent", records: absentRecords, color: "bg-rose-500", hoverColor: "hover:border-rose-500/40", badgeVariant: "destructive" as const, clockColor: "text-rose-500" },
  ];

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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-7 text-xs"
          />
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {filteredAttendance.length} entries
        </span>
      </div>

      {/* Content View */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>In</TableHead>
                  <TableHead>Out</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-20 text-center text-xs text-muted-foreground">
                      No records.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAttendance.map((record) => (
                    <TableRow key={record.id}>
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

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAttendance.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colPage = kanbanPages[col.key] || 1;
            const colTotalPages = Math.ceil(col.records.length / pageSize);
            const paginatedColRecords = col.records.slice((colPage - 1) * pageSize, colPage * pageSize);

            return (
              <div key={col.key} className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {col.title} ({col.records.length})
                    </h3>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {paginatedColRecords.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg">
                      No logs.
                    </div>
                  ) : (
                    paginatedColRecords.map((r) => (
                      <div key={r.id} className={`p-3 rounded-lg border border-border/80 bg-card ${col.hoverColor} transition-all space-y-2`}>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold text-foreground">{r.employee}</h4>
                          <Badge variant={col.badgeVariant} className="text-[10px] font-mono shrink-0">
                            {r.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                          <span className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 ${col.clockColor}`} /> {r.checkIn} - {r.checkOut}
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

                {colTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] font-mono text-muted-foreground">
                    <span>Page {colPage} of {colTotalPages}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="iconSm"
                        className="h-6 w-6"
                        disabled={colPage <= 1}
                        onClick={() => setKanbanPages((prev) => ({ ...prev, [col.key]: colPage - 1 }))}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="iconSm"
                        className="h-6 w-6"
                        disabled={colPage >= colTotalPages}
                        onClick={() => setKanbanPages((prev) => ({ ...prev, [col.key]: colPage + 1 }))}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

