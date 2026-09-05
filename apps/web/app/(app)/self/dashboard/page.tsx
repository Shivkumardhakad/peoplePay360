import Link from "next/link";
import { CalendarClock, Clock, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hrApiFetch } from "@/lib/hr-api";
import { formatDate, formatDateTime, formatHours, humanizeStatus, statusTone } from "../self-service-utils";

type Allocation = {
  id: string;
  allocated: string;
  consumed: string;
  remaining: string | null;
  periodStart: string;
  periodEnd: string;
  timeOffType: { name: string; unit: string };
};

type TimeOffRequest = {
  id: string;
  startDate: string;
  endDate: string;
  quantity: string;
  status: string;
  timeOffType: { name: string; unit: string };
};

type Attendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  status: string;
};

type Dashboard = {
  allocations: Allocation[];
  todayAttendance: Attendance | null;
  pendingRequests: TimeOffRequest[];
};

export default async function EmployeeDashboardPage() {
  const dashboard = await hrApiFetch<Dashboard>("/me/dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your attendance status, leave balances, and pending requests.</p>
        </div>
        <Link href="/self/profile">
          <Button variant="outline" className="gap-2 bg-card">
            <UserRound className="h-4 w-4" />
            Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="pp-glass p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
            <Clock className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-3 space-y-2">
            <StatusBadge tone={statusTone(dashboard.todayAttendance?.status)} label={humanizeStatus(dashboard.todayAttendance?.status ?? "No Entry")} />
            <p className="font-mono text-xs text-muted-foreground">
              {dashboard.todayAttendance ? `${formatDateTime(dashboard.todayAttendance.checkIn)} to ${formatDateTime(dashboard.todayAttendance.checkOut)}` : "No attendance submitted today"}
            </p>
          </div>
        </div>

        <div className="pp-glass p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leave Remaining</p>
            <CalendarClock className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-3 font-mono text-2xl font-bold">
            {dashboard.allocations.reduce((total, allocation) => total + Number(allocation.remaining ?? allocation.allocated), 0).toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">days or hours across active allocations</p>
        </div>

        <div className="pp-glass p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Requests</p>
          <p className="mt-3 font-mono text-2xl font-bold">{dashboard.pendingRequests.length}</p>
          <p className="text-xs text-muted-foreground">awaiting HR review</p>
        </div>
      </div>

      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[0.5px] border-border bg-muted/20 hover:bg-muted/20">
              <TableHead>Leave Type</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Taken</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead>Validity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboard.allocations.map((allocation) => (
              <TableRow key={allocation.id} className="border-b-[0.5px] border-border hover:bg-muted/30">
                <TableCell className="font-medium">{allocation.timeOffType.name}</TableCell>
                <TableCell className="text-right font-mono text-xs">{allocation.allocated}</TableCell>
                <TableCell className="text-right font-mono text-xs">{allocation.consumed}</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">{allocation.remaining ?? allocation.allocated}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(allocation.periodStart)} - {formatDate(allocation.periodEnd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[0.5px] border-border bg-muted/20 hover:bg-muted/20">
              <TableHead>Pending Request</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboard.pendingRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">No pending requests.</TableCell>
              </TableRow>
            ) : (
              dashboard.pendingRequests.map((request) => (
                <TableRow key={request.id} className="border-b-[0.5px] border-border hover:bg-muted/30">
                  <TableCell className="font-medium">{request.timeOffType.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(request.startDate)} - {formatDate(request.endDate)}</TableCell>
                  <TableCell className="text-right font-mono text-xs">{request.quantity} {request.timeOffType.unit.toLowerCase()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
