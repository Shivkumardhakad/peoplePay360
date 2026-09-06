"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createAttendanceAction, getEmployeesAction } from "@/lib/api-actions";
import { Loader2 } from "lucide-react";

const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY"]),
  remarks: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export function AttendanceForm({
  defaultValues,
  onSuccess,
  onCancel,
}: {
  defaultValues?: Partial<AttendanceFormValues>;
  onSuccess?: (att: AttendanceFormValues) => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: string; employeeNumber: string; name: string }>>([]);

  useEffect(() => {
    getEmployeesAction().then((res) => {
      setEmployees(res);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: defaultValues || {
      status: "PRESENT",
      date: new Date().toISOString().split("T")[0] || "2023-10-01",
      checkIn: "09:00",
      checkOut: "17:00",
    },
  });

  const onSubmit = async (data: AttendanceFormValues) => {
    setSubmitting(true);
    try {
      const res = await createAttendanceAction(data);
      if (res.success) {
        toast({
          title: "Attendance Recorded",
          description: `Entry logged for date ${data.date}.`,
          type: "success",
        });
        onSuccess?.(data);
      } else {
        toast({
          title: "Failed to record",
          description: res.error || "An error occurred",
          type: "error",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error occurred",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="employeeId" className="text-xs font-medium">Employee</Label>
          <select
            id="employeeId"
            {...register("employeeId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeNumber || emp.id.slice(0, 8)})
              </option>
            ))}
          </select>
          {errors.employeeId && <p className="text-[11px] text-destructive">{errors.employeeId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-xs font-medium">Date</Label>
          <Input id="date" type="date" className="font-mono text-xs" {...register("date")} />
          {errors.date && <p className="text-[11px] text-destructive">{errors.date.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="checkIn" className="text-xs font-medium">Check-in Time</Label>
          <Input id="checkIn" type="time" className="font-mono text-xs" {...register("checkIn")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkOut" className="text-xs font-medium">Check-out Time</Label>
          <Input id="checkOut" type="time" className="font-mono text-xs" {...register("checkOut")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs font-medium">Status</Label>
          <select
            id="status"
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="remarks" className="text-xs font-medium">Remarks / Reason</Label>
          <Input id="remarks" placeholder="Optional notes" className="text-xs" {...register("remarks")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 h-8">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitting ? "Saving..." : "Save Record"}</span>
        </Button>
      </div>
    </form>
  );
}
