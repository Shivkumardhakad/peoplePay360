"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const typeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  unit: z.enum(["DAYS", "HOURS"]),
  requiresApproval: z.boolean(),
  isPaid: z.boolean(),
});

export type TimeOffTypeFormValues = z.infer<typeof typeSchema>;

export function TimeOffTypeForm({ defaultValues }: { defaultValues?: Partial<TimeOffTypeFormValues> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<TimeOffTypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: defaultValues || {
      unit: "DAYS",
      requiresApproval: true,
      isPaid: true,
    },
  });

  const onSubmit = (data: TimeOffTypeFormValues) => {
    console.log("Submit type:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <select 
          id="unit" 
          {...register("unit")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="DAYS">Days</option>
          <option value="HOURS">Hours</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="requiresApproval" {...register("requiresApproval")} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
        <Label htmlFor="requiresApproval">Requires Approval</Label>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="isPaid" {...register("isPaid")} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
        <Label htmlFor="isPaid">Is Paid</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline">Cancel</Button>
        <Button type="submit">Save Type</Button>
      </div>
    </form>
  );
}
