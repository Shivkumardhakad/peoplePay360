"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createContractAction, getEmployeesAction } from "@/lib/api-actions";
import { Loader2 } from "lucide-react";

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
  isEditing = false,
  onSuccess,
  onCancel,
}: {
  defaultValues?: Partial<ContractFormInput>;
  isEditing?: boolean;
  onSuccess?: (contract: ContractFormValues) => void;
  onCancel?: () => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Array<{ id: string; employeeNumber: string; name: string }>>([]);

  useEffect(() => {
    getEmployeesAction().then((res) => {
      if (res && res.length > 0) {
        setEmployees(res);
      }
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContractFormInput, unknown, ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: defaultValues || {
      employmentType: "FULL_TIME",
      salaryStructureId: "STR-001",
      workingScheduleId: "SCH-001",
      startDate: new Date().toISOString().split("T")[0] || "2023-10-01",
    },
  });

  const onSubmit = async (data: ContractFormValues) => {
    setSubmitting(true);
    try {
      const res = await createContractAction(data);
      if (res.success) {
        toast({
          title: "Contract Saved",
          description: `Employment terms recorded for employee.`,
          type: "success",
        });
        onSuccess?.(data);
      } else {
        toast({
          title: "Error saving contract",
          description: res.error || "Please check provided fields.",
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
            disabled={isEditing}
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
          <Label htmlFor="employmentType" className="text-xs font-medium">Employment Type</Label>
          <select
            id="employmentType"
            {...register("employmentType")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="FULL_TIME">Full-time Regular</option>
            <option value="PART_TIME">Part-time</option>
            <option value="CONTRACTOR">Contractor / Fixed Term</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="position" className="text-xs font-medium">Position Title</Label>
          <Input id="position" placeholder="e.g. Senior Frontend Engineer" {...register("position")} />
          {errors.position && <p className="text-[11px] text-destructive">{errors.position.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="department" className="text-xs font-medium">Department</Label>
          <select
            id="department"
            {...register("department")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select Department</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
            <option value="Product & Design">Product & Design</option>
          </select>
          {errors.department && <p className="text-[11px] text-destructive">{errors.department.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="startDate" className="text-xs font-medium">Start Date</Label>
          <Input id="startDate" type="date" className="font-mono text-xs" {...register("startDate")} />
          {errors.startDate && <p className="text-[11px] text-destructive">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="endDate" className="text-xs font-medium">End Date (Optional)</Label>
          <Input id="endDate" type="date" className="font-mono text-xs" {...register("endDate")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wage" className="text-xs font-medium">Annual Base Salary (USD)</Label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">$</span>
          <Input
            id="wage"
            type="number"
            step="1000"
            placeholder="95000"
            className="font-mono text-xs pl-7"
            {...register("wage")}
          />
        </div>
        {errors.wage && <p className="text-[11px] text-destructive">{errors.wage.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="salaryStructureId" className="text-xs font-medium">Salary Structure</Label>
          <select
            id="salaryStructureId"
            {...register("salaryStructureId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="STR-001">Standard Tech Package (STR-001)</option>
            <option value="STR-002">Executive Package (STR-002)</option>
            <option value="STR-003">Operations Base (STR-003)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workingScheduleId" className="text-xs font-medium">Working Schedule</Label>
          <select
            id="workingScheduleId"
            {...register("workingScheduleId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="SCH-001">Standard 40h (Mon-Fri 9-5)</option>
            <option value="SCH-002">Part Time 20h</option>
            <option value="SCH-003">Flexible Remote 37.5h</option>
          </select>
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
          <span>{submitting ? "Saving..." : "Save Contract"}</span>
        </Button>
      </div>
    </form>
  );
}
