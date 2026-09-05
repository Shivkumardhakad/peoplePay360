import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-muted/60 text-muted-foreground border border-border">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold font-mono tracking-tight text-foreground">404 — Page Not Found</h1>
          <p className="text-xs text-muted-foreground">
            The page you requested does not exist or you do not have permission to view it.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button size="sm" className="gap-1.5 h-8">
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
