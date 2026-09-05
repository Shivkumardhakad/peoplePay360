import { revalidatePath } from "next/cache";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { hrApiFetch } from "@/lib/hr-api";
import { formatDate, humanizeStatus, statusTone, todayInputValue } from "../self-service-utils";

type TimeOffType = {
  id: string;
  name: string;
  unit: string;
};

type Allocation = {
  id: string;
  allocated: string;
  consumed: string;
  remaining: string | null;
  periodStart: string;
  periodEnd: string;
  timeOffType: TimeOffType;
};

type TimeOffRequest = {
  id: string;
  startDate: string;
  endDate: string;
  quantity: string;
  status: string;
  reason: string | null;
  timeOffType: TimeOffType;
};

async function submitTimeOffRequest(formData: FormData) {
  "use server";

  await hrApiFetch("/me/time-off/requests", {
    method: "POST",
    body: {
      timeOffTypeId: String(formData.get("timeOffTypeId") ?? ""),
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      quantity: String(formData.get("quantity") ?? ""),
      reason: String(formData.get("reason") ?? "")
    }
  });

  revalidatePath("/self/time-off");
  revalidatePath("/self/dashboard");
}

export default async function MyTimeOffPage() {
  const [requests, allocations, types] = await Promise.all([
    hrApiFetch<TimeOffRequest[]>("/me/time-off"),
    hrApiFetch<Allocation[]>("/me/time-off/allocations"),
    hrApiFetch<TimeOffType[]>("/me/time-off/types")
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-accent" />
          <h1 className="text-2xl font-bold tracking-tight">My Time Off</h1>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">Submit leave requests and review your balances.</p>
      </div>

      <form action={submitTimeOffRequest} className="pp-glass grid gap-4 p-4 md:grid-cols-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="timeOffTypeId">Leave Type</Label>
          <select id="timeOffTypeId" name="timeOffTypeId" required className="flex h-10 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">Select type</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Start</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={todayInputValue()} required className="bg-background/80 font-mono text-sm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={todayInputValue()} required className="bg-background/80 font-mono text-sm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Duration</Label>
          <Input id="quantity" name="quantity" type="number" min="0.5" step="0.5" defaultValue="1" required className="bg-background/80 font-mono text-sm" />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Submit</Button>
        </div>
        <div className="space-y-2 md:col-span-6">
          <Label htmlFor="reason">Reason</Label>
          <Input id="reason" name="reason" placeholder="Optional note for HR" className="bg-background/80" />
        </div>
      </form>

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
            {allocations.map((allocation) => (
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
              <TableHead>Request</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} className="border-b-[0.5px] border-border hover:bg-muted/30">
                <TableCell className="font-medium">{request.timeOffType.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{formatDate(request.startDate)} - {formatDate(request.endDate)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{request.quantity} {request.timeOffType.unit.toLowerCase()}</TableCell>
                <TableCell>
                  <StatusBadge tone={statusTone(request.status)} label={request.status === "REJECTED" ? "Refused" : humanizeStatus(request.status)} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{request.reason || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
