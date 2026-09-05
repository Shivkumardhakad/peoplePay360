"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const structureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
});

export type SalaryStructureFormValues = z.infer<typeof structureSchema>;

export function SalaryStructureForm({ defaultValues }: { defaultValues?: Partial<SalaryStructureFormValues> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<SalaryStructureFormValues>({
    resolver: zodResolver(structureSchema),
    defaultValues: defaultValues || {
      status: "DRAFT",
    },
  });

  const onSubmit = (data: SalaryStructureFormValues) => {
    console.log("Submit structure:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Structure Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select 
          id="status" 
          {...register("status")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="space-y-2 pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">Attached Rules (Sequence)</h4>
        
        {/* Mocking the rule selection for MVP UI */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input type="number" className="w-20 font-mono text-center" defaultValue={10} />
            <span className="text-sm border rounded-md px-3 py-2 bg-muted/50 flex-1">Basic Salary (BASIC)</span>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" className="w-20 font-mono text-center" defaultValue={20} />
            <span className="text-sm border rounded-md px-3 py-2 bg-muted/50 flex-1">Housing Allowance (HRA)</span>
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" className="w-20 font-mono text-center" defaultValue={100} />
            <span className="text-sm border rounded-md px-3 py-2 bg-muted/50 flex-1">Gross Salary (GROSS)</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Save Structure</Button>
      </div>
    </form>
  );
}
