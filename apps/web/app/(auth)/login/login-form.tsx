"use client";

import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl: "/dashboard",
      redirect: false
    });

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = result?.url ?? "/dashboard";
  }

  return (
    <form className="grid gap-4" action={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Email
        <input
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700"
          name="email"
          type="email"
          defaultValue="admin@peoplepay360.local"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Password
        <input
          className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-700"
          name="password"
          type="password"
          defaultValue="Admin123!"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <Button type="submit" className="gap-2">
        <LogIn className="size-4" />
        Sign in
      </Button>
    </form>
  );
}
