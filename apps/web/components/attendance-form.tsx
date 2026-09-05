"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY"]),
  remarks: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceSchema>;

export function AttendanceForm({ defaultValues }: { defaultValues?: Partial<AttendanceFormValues> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: defaultValues || {
      status: "PRESENT",
    },
  });

  const onSubmit = (data: AttendanceFormValues) => {
    console.log("Submit attendance:", data);
    // TODO: Wire server action / API call here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeId">Employee</Label>
          <select 
            id="employeeId" 
            {...register("employeeId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select Employee</option>
            <option value="EMP-001">Alice Johnson</option>
            <option value="EMP-002">Bob Smith</option>
          </select>
          {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" className="font-mono" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkIn">Check In Time</Label>
          <Input id="checkIn" type="time" className="font-mono" {...register("checkIn")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkOut">Check Out Time</Label>
          <Input id="checkOut" type="time" className="font-mono" {...register("checkOut")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select 
            id="status" 
            {...register("status")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Input id="remarks" {...register("remarks")} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Save Attendance</Button>
      </div>
    </form>
  );
}
