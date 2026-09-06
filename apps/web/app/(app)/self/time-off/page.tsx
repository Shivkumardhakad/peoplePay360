import { revalidatePath } from "next/cache";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hrApiFetch } from "@/lib/hr-api";
import { todayInputValue } from "../self-service-utils";
import { TimeOffTablesClient } from "./time-off-tables-client";

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

      <TimeOffTablesClient allocations={allocations} requests={requests} />
    </div>
  );
}

