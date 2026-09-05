"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export function SalaryRuleForm({ defaultValues }: { defaultValues?: Partial<SalaryRuleFormInput> }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SalaryRuleFormInput, unknown, SalaryRuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: defaultValues || {
      category: "BASIC",
      calculationType: "FIXED",
      sequence: 10,
    },
  });

  const calculationType = watch("calculationType");

  const onSubmit = (data: SalaryRuleFormValues) => {
    console.log("Submit rule:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Rule Name</Label>
          <Input id="name" {...register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" className="font-mono uppercase" {...register("code")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select 
            id="category" 
            {...register("category")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="BASIC">Basic</option>
            <option value="ALLOWANCE">Allowance</option>
            <option value="DEDUCTION">Deduction</option>
            <option value="CONTRIBUTION">Contribution</option>
            <option value="GROSS">Gross</option>
            <option value="NET">Net</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sequence">Sequence</Label>
          <Input id="sequence" type="number" className="font-mono" {...register("sequence")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calculationType">Calculation Type</Label>
        <select 
          id="calculationType" 
          {...register("calculationType")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="FIXED">Fixed Amount</option>
          <option value="PERCENTAGE">Percentage</option>
          <option value="SUM">Sum of Rules</option>
        </select>
      </div>

      {calculationType === "PERCENTAGE" && (
        <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/20">
          <div className="space-y-2">
            <Label htmlFor="referenceRuleCode">Reference Rule</Label>
            <select 
              id="referenceRuleCode" 
              {...register("referenceRuleCode")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            >
              <option value="">Select rule</option>
              <option value="BASIC">BASIC</option>
              <option value="GROSS">GROSS</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="percentage">Percentage (%)</Label>
            <Input id="percentage" type="number" step="0.01" className="font-mono" {...register("percentage")} />
          </div>
        </div>
      )}

      {calculationType === "FIXED" && (
        <div className="space-y-2 p-4 border rounded-md bg-muted/20">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
            <Input id="amount" type="number" step="0.01" className="font-mono pl-7" {...register("amount")} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Save Rule</Button>
      </div>
    </form>
  );
}
