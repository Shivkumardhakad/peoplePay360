"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/components/app-sidebar";

function formatRole(role: Session["user"]["role"]) {
  if (!role) return "User";
  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getBadgeVariant(role: Session["user"]["role"]) {
  switch (role) {
    case "ADMIN":
      return "default";
    case "HR_MANAGER":
      return "info";
    case "PAYROLL_MANAGER":
    case "HR_PAYROLL_USER":
      return "warning";
    default:
      return "success";
  }
}

export function AppTopbar({ session }: { session: Session }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="h-11 shrink-0 border-b border-border bg-background/95 backdrop-blur-xs px-4 flex items-center justify-between z-10">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-semibold font-mono text-foreground">
          {initials}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold tracking-tight text-foreground">
            {session.user.name}
          </p>
          <Badge variant={getBadgeVariant(session.user.role) as any} className="font-mono text-[10px] px-1.5 py-0 h-4">
            {formatRole(session.user.role)}
          </Badge>
          {session.user.role === "EMPLOYEE" && session.user.employeeId && (
            <span className="text-[10px] text-muted-foreground font-mono">
              ({session.user.employeeId})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
          className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-foreground"
        >
          {loggingOut ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Signing out...</span>
            </>
          ) : (
            <>
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
