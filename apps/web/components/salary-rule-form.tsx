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

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  category: z.enum(["BASIC", "ALLOWANCE", "DEDUCTION", "CONTRIBUTION", "GROSS", "NET"]),
  sequence: z.coerce.number().min(1, "Sequence must be at least 1"),
  calculationType: z.enum(["FIXED", "PERCENTAGE", "SUM"]),
  referenceRuleCode: z.string().optional(),
  percentage: z.coerce.number().optional(),
  amount: z.coerce.number().optional(),
});

export type SalaryRuleFormInput = z.input<typeof ruleSchema>;
export type SalaryRuleFormValues = z.output<typeof ruleSchema>;

export function SalaryRuleForm({
  defaultValues,
  onSuccess,
}: {
  defaultValues?: Partial<SalaryRuleFormInput>;
  onSuccess?: (val: SalaryRuleFormValues) => void;
}) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SalaryRuleFormInput, unknown, SalaryRuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: defaultValues || {
      category: "BASIC",
      calculationType: "FIXED",
      sequence: 10,
    },
  });

  const calculationType = watch("calculationType");

  const onSubmit = async (data: SalaryRuleFormValues) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setSubmitting(false);

    toast({
      title: "Salary Rule Configured",
      description: `Rule ${data.code} (${data.name}) added to active catalog.`,
      type: "success",
    });
    onSuccess?.(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium">Rule Name</Label>
        <Input id="name" placeholder="e.g. Provident Fund Deduction" {...register("name")} />
        {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="code" className="text-xs font-medium">Code</Label>
          <Input id="code" placeholder="PF" className="font-mono uppercase text-xs" {...register("code")} />
          {errors.code && <p className="text-[11px] text-destructive">{errors.code.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sequence" className="text-xs font-medium">Sequence</Label>
          <Input id="sequence" type="number" className="font-mono text-xs" {...register("sequence")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="category" className="text-xs font-medium">Category</Label>
          <select
            id="category"
            {...register("category")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="BASIC">Basic</option>
            <option value="ALLOWANCE">Allowance</option>
            <option value="DEDUCTION">Deduction</option>
            <option value="CONTRIBUTION">Contribution</option>
            <option value="GROSS">Gross Total</option>
            <option value="NET">Net Total</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="calculationType" className="text-xs font-medium">Calc Method</Label>
          <select
            id="calculationType"
            {...register("calculationType")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="FIXED">Fixed Value</option>
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="SUM">Sum Aggregation</option>
          </select>
        </div>
      </div>

      {calculationType === "PERCENTAGE" && (
        <div className="grid grid-cols-2 gap-3 p-3 border border-border rounded-md bg-muted/20">
          <div className="space-y-1.5">
            <Label htmlFor="referenceRuleCode" className="text-xs font-medium">Reference Code</Label>
            <select
              id="referenceRuleCode"
              {...register("referenceRuleCode")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
            >
              <option value="BASIC">BASIC</option>
              <option value="GROSS">GROSS</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="percentage" className="text-xs font-medium">Rate (%)</Label>
            <Input id="percentage" type="number" step="0.01" placeholder="10.0" className="font-mono text-xs" {...register("percentage")} />
          </div>
        </div>
      )}

      {calculationType === "FIXED" && (
        <div className="space-y-1.5 p-3 border border-border rounded-md bg-muted/20">
          <Label htmlFor="amount" className="text-xs font-medium">Fixed Amount ($)</Label>
          <Input id="amount" type="number" step="0.01" placeholder="500.00" className="font-mono text-xs" {...register("amount")} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <Button type="submit" size="sm" disabled={submitting} className="gap-1.5 h-8">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{submitting ? "Saving Rule..." : "Save Salary Rule"}</span>
        </Button>
      </div>
    </form>
  );
}
