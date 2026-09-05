"use client";

import * as React from "react";
import { FormProvider, type UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

export function Form<T extends Record<string, unknown>>({
  children,
  ...form
}: UseFormReturn<T> & {
  children: React.ReactNode;
}) {
  return <FormProvider {...form}>{children}</FormProvider>;
}

export function FormFieldset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-slate-800", className)} {...props} />;
}

export function FormMessage({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-red-700", className)} {...props} />;
}
