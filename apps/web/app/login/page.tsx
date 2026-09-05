"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginSchemaInput } from "@peoplepay360/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchemaInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaInput) => {
    setAuthError(null);

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!res || res.error) {
        setAuthError("Invalid email or password. Please check your credentials.");
        return;
      }

      // Fetch session immediately to check user role and employeeId
      const session = await getSession();

      if (session?.user?.role === "EMPLOYEE" && session.user.employeeId) {
        router.push(`/employees/${session.user.employeeId}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setAuthError("An unexpected error occurred during authentication. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md pp-glass border-border shadow-none">
        <CardHeader className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm font-mono">
                P
              </div>
              <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                PeoplePay360
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              Ledger Auth
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground pt-1">
            Enter your employee credentials to access the HR & Payroll ledger.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                disabled={isSubmitting}
                className="font-mono text-sm bg-background/80"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                disabled={isSubmitting}
                className="font-mono text-sm bg-background/80"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Inline Error Message positioning per spec */}
            {authError && (
              <div className="flex items-center gap-2 p-3 text-xs rounded border border-destructive/30 bg-destructive/10 text-destructive mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-medium h-10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
