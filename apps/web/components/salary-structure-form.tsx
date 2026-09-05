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

const structureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
});

export type SalaryStructureFormValues = z.infer<typeof structureSchema>;

export function SalaryStructureForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: Partial<SalaryStructureFormValues>;
  onSuccess?: (data: SalaryStructureFormValues) => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalaryStructureFormValues>({
    resolver: zodResolver(structureSchema),
    defaultValues: defaultValues || {
      status: "ACTIVE",
    },
  });

  const onSubmit = async (data: SalaryStructureFormValues) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);

    toast({
      title: "Structure Created",
      description: `Salary Structure "${data.name}" is now available for contracts.`,
      type: "success",
    });
    onSuccess?.(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium">Structure Name</Label>
        <Input id="name" placeholder="e.g. Sales Executive Package" {...register("name")} />
        {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status" className="text-xs font-medium">Lifecycle Status</Label>
        <select
          id="status"
          {...register("status")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="space-y-2 pt-3 border-t border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
          Attached Rules Sequence
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded w-12 text-center border">10</span>
            <span className="text-xs border border-border rounded-md px-3 py-1.5 bg-background flex-1 text-foreground">
              Basic Salary (BASIC)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded w-12 text-center border">20</span>
            <span className="text-xs border border-border rounded-md px-3 py-1.5 bg-background flex-1 text-foreground">
              Housing Allowance (HRA)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded w-12 text-center border">100</span>
            <span className="text-xs border border-border rounded-md px-3 py-1.5 bg-background flex-1 text-foreground">
              Gross Total (GROSS)
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 h-8">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitting ? "Saving Structure..." : "Save Structure"}</span>
        </Button>
      </div>
    </form>
  );
}
