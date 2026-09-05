"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const contractSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACTOR"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  wage: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  salaryStructureId: z.string().min(1, "Salary structure is required"),
  workingScheduleId: z.string().min(1, "Working schedule is required"),
});

export type ContractFormInput = z.input<typeof contractSchema>;
export type ContractFormValues = z.output<typeof contractSchema>;

export function ContractForm({ 
  defaultValues, 
  isEditing = false 
}: { 
  defaultValues?: Partial<ContractFormInput>;
  isEditing?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContractFormInput, unknown, ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: defaultValues || {
      employmentType: "FULL_TIME",
    },
  });

  const onSubmit = (data: ContractFormValues) => {
    console.log("Submit contract form:", data);
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
            disabled={isEditing}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select Employee</option>
            <option value="EMP-001">Alice Johnson</option>
            <option value="EMP-002">Bob Smith</option>
          </select>
          {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <select 
            id="employmentType" 
            {...register("employmentType")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="FULL_TIME">Full-time</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACTOR">Contractor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input id="position" {...register("position")} />
          {errors.position && <p className="text-sm text-destructive">{errors.position.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <select 
            id="department" 
            {...register("department")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a department</option>
            <option value="Engineering">Engineering</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
          </select>
          {errors.department && <p className="text-sm text-destructive">{errors.department.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" className="font-mono" {...register("startDate")} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" className="font-mono" {...register("endDate")} />
          <p className="text-xs text-muted-foreground">Leave blank if ongoing</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wage">Wage (Annual/Hourly)</Label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
          <Input 
            id="wage" 
            type="number" 
            step="0.01" 
            className="font-mono pl-7" 
            {...register("wage")} 
          />
        </div>
        {errors.wage && <p className="text-sm text-destructive">{errors.wage.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salaryStructureId">Salary Structure</Label>
          <select 
            id="salaryStructureId" 
            {...register("salaryStructureId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select structure</option>
            <option value="STR-001">Standard Tech Package</option>
            <option value="STR-002">Executive Package</option>
          </select>
          {errors.salaryStructureId && <p className="text-sm text-destructive">{errors.salaryStructureId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="workingScheduleId">Working Schedule</Label>
          <select 
            id="workingScheduleId" 
            {...register("workingScheduleId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select schedule</option>
            <option value="SCH-001">Standard 40h Mon-Fri</option>
            <option value="SCH-002">Part Time 20h</option>
          </select>
          {errors.workingScheduleId && <p className="text-sm text-destructive">{errors.workingScheduleId.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Save Contract</Button>
      </div>
    </form>
  );
}
