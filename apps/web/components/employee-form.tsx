"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createEmployeeAction, updateEmployeeAction } from "@/lib/api-actions";
import { Loader2 } from "lucide-react";

const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  department: z.string().min(1, "Department is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export function EmployeeForm({
  employeeId,
  defaultValues,
  onSuccess,
  onCancel,
  readOnly = false,
}: {
  employeeId?: string;
  defaultValues?: Partial<EmployeeFormValues>;
  onSuccess?: (emp: EmployeeFormValues) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaultValues || {
      status: "ACTIVE",
      dateOfJoining: new Date().toISOString().split("T")[0] || "2023-10-01",
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    setSubmitting(true);
    try {
      const isEditing = Boolean(employeeId);
      const res = isEditing && employeeId
        ? await updateEmployeeAction(employeeId, data)
        : await createEmployeeAction(data);

      if (res.success) {
        toast({
          title: isEditing ? "Employee Updated" : "Employee Created",
          description: isEditing
            ? `${data.firstName} ${data.lastName} record updated.`
            : `${data.firstName} ${data.lastName} added to employee records.`,
          type: "success",
        });
        onSuccess?.(data);
      } else {
        toast({
          title: isEditing ? "Failed to update" : "Failed to create",
          description: res.error || "An error occurred",
          type: "error",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Unexpected network error",
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
          <Label htmlFor="firstName" className="text-xs font-medium">First Name</Label>
          <Input id="firstName" placeholder="Jane" disabled={readOnly} {...register("firstName")} />
          {errors.firstName && <p className="text-[11px] text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="text-xs font-medium">Last Name</Label>
          <Input id="lastName" placeholder="Doe" disabled={readOnly} {...register("lastName")} />
          {errors.lastName && <p className="text-[11px] text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium">Work Email</Label>
          <Input id="email" type="email" placeholder="jane.doe@company.com" disabled={readOnly} className="font-mono text-xs" {...register("email")} />
          {errors.email && <p className="text-[11px] text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs font-medium">Phone</Label>
          <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" disabled={readOnly} className="font-mono text-xs" {...register("phone")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dateOfJoining" className="text-xs font-medium">Date of Joining</Label>
          <Input id="dateOfJoining" type="date" disabled={readOnly} className="font-mono text-xs" {...register("dateOfJoining")} />
          {errors.dateOfJoining && <p className="text-[11px] text-destructive">{errors.dateOfJoining.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="department" className="text-xs font-medium">Department</Label>
          <select
            id="department"
            disabled={readOnly}
            {...register("department")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <option value="">Select Department</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Product & Design">Product & Design</option>
          </select>
          {errors.department && <p className="text-[11px] text-destructive">{errors.department.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status" className="text-xs font-medium">Employment Status</Label>
        <select
          id="status"
          disabled={readOnly}
          {...register("status")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-75 disabled:cursor-not-allowed"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ON_LEAVE">On Leave</option>
        </select>
      </div>

      {!readOnly ? (
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 h-8">
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{submitting ? "Saving..." : "Save Employee"}</span>
          </Button>
        </div>
      ) : (
        <div className="pt-2 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <span>Official employee record managed by HR Department.</span>
          <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded border border-border">Locked</span>
        </div>
      )}
    </form>
  );
}
