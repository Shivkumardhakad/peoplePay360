import { revalidatePath } from "next/cache";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hrApiFetch } from "@/lib/hr-api";
import { formatDate, formatDateTime, formatHours, humanizeStatus, statusTone, todayInputValue } from "../self-service-utils";

type Attendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakMinutes: number;
  workedMinutes: number;
  status: string;
};

async function submitAttendance(formData: FormData) {
  "use server";

  const date = String(formData.get("date") ?? "");
  const checkIn = String(formData.get("checkIn") ?? "");
  const checkOut = String(formData.get("checkOut") ?? "");
  const status = String(formData.get("status") ?? "PRESENT");
  const breakMinutes = Number(formData.get("breakMinutes") ?? 0);

  await hrApiFetch("/me/attendance", {
    method: "POST",
    body: {
      date,
      checkIn: checkIn ? `${date}T${checkIn}:00.000Z` : null,
      checkOut: checkOut ? `${date}T${checkOut}:00.000Z` : null,
      breakMinutes,
      status
    }
  });

  revalidatePath("/self/attendance");
  revalidatePath("/self/dashboard");
}

export default async function MyAttendancePage() {
  const attendance = await hrApiFetch<Attendance[]>("/me/attendance");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">Submit your own attendance entries and review your recent records.</p>
      </div>

      <form action={submitAttendance} className="pp-glass grid gap-4 p-4 md:grid-cols-6">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" defaultValue={todayInputValue()} required className="bg-background/80 font-mono text-sm" />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="checkIn">Check In</Label>
          <Input id="checkIn" name="checkIn" type="time" className="bg-background/80 font-mono text-sm" />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="checkOut">Check Out</Label>
          <Input id="checkOut" name="checkOut" type="time" className="bg-background/80 font-mono text-sm" />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="breakMinutes">Break</Label>
          <Input id="breakMinutes" name="breakMinutes" type="number" min="0" defaultValue="30" className="bg-background/80 font-mono text-sm" />
        </div>
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" defaultValue="PRESENT" className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="REMOTE">Remote</option>
          </select>
        </div>
        <div className="flex items-end md:col-span-1">
          <Button type="submit" className="w-full">Submit</Button>
        </div>
      </form>

      <div className="pp-solid-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[0.5px] border-border bg-muted/20 hover:bg-muted/20">
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead className="text-right">Break</TableHead>
              <TableHead className="text-right">Worked</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.map((record) => (
              <TableRow key={record.id} className="border-b-[0.5px] border-border hover:bg-muted/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(record.date)}</TableCell>
                <TableCell className="font-mono text-xs">{formatDateTime(record.checkIn)}</TableCell>
                <TableCell className="font-mono text-xs">{formatDateTime(record.checkOut)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{record.breakMinutes}m</TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">{formatHours(record.workedMinutes)}</TableCell>
                <TableCell className="text-right">
                  <StatusBadge tone={statusTone(record.status)} label={humanizeStatus(record.status)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
