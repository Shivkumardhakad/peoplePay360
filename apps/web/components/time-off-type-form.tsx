"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

const typeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["DAYS", "HOURS"]),
  requiresApproval: z.boolean(),
  isPaid: z.boolean(),
});

export type TimeOffTypeFormValues = z.infer<typeof typeSchema>;

export function TimeOffTypeForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: Partial<TimeOffTypeFormValues>;
  onSuccess?: (data: TimeOffTypeFormValues) => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimeOffTypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: defaultValues || {
      unit: "DAYS",
      requiresApproval: true,
      isPaid: true,
    },
  });

  const onSubmit = async (data: TimeOffTypeFormValues) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);

    toast({
      title: "Leave Policy Created",
      description: `Policy "${data.name}" added to leave catalog.`,
      type: "success",
    });
    onSuccess?.(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium">Policy Name</Label>
        <Input id="name" placeholder="e.g. Parental Leave" {...register("name")} />
        {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="unit" className="text-xs font-medium">Accounting Unit</Label>
        <select
          id="unit"
          {...register("unit")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="DAYS">Days</option>
          <option value="HOURS">Hours</option>
        </select>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="requiresApproval"
          {...register("requiresApproval")}
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
        />
        <Label htmlFor="requiresApproval" className="text-xs font-medium cursor-pointer">
          Requires Manager Approval
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPaid"
          {...register("isPaid")}
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
        />
        <Label htmlFor="isPaid" className="text-xs font-medium cursor-pointer">
          Paid Leave (Full Wage Preservation)
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 h-8">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitting ? "Saving Policy..." : "Save Policy"}</span>
        </Button>
      </div>
    </form>
  );
}
