"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { Session } from "@/components/app-sidebar";

function formatRole(role: Session["user"]["role"]) {
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function AppTopbar({ session }: { session: Session }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-8">
      <div>
        <p className="text-sm font-medium">{session.user.name}</p>
        <p className="text-xs text-muted-foreground">{formatRole(session.user.role)}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </header>
  );
}
