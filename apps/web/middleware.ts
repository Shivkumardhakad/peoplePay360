import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const role = request.nextauth.token?.role;
    const pathname = request.nextUrl.pathname;

    const empId = request.nextauth.token?.employeeId;

    // Team & Roles (/users) is strictly ADMIN only
    if (pathname.startsWith("/users") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(role === "EMPLOYEE" ? (empId ? `/employees/${empId}` : "/time-off/requests") : "/dashboard", request.url));
    }

    // HR_MANAGER has no payroll access
    if (pathname.startsWith("/payroll") && role === "HR_MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (pathname.startsWith("/reports") && !["ADMIN", "PAYROLL_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"].includes(role ?? "")) {
      return NextResponse.redirect(new URL(role === "EMPLOYEE" ? "/payroll/payslips" : "/dashboard", request.url));
    }

    if (pathname.startsWith("/audit-logs") && !["ADMIN", "PAYROLL_MANAGER", "HR_PAYROLL_MANAGER", "HR_PAYROLL_USER"].includes(role ?? "")) {
      return NextResponse.redirect(new URL(role === "EMPLOYEE" ? "/payroll/payslips" : "/dashboard", request.url));
    }

    // EMPLOYEE role boundaries per AGENTS.md:
    if (role === "EMPLOYEE") {
      // Employees cannot access dashboard -> redirect to self profile
      if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL(empId ? `/employees/${empId}` : "/attendance", request.url));
      }

      // Employees cannot access full employee directory or contracts
    if (pathname === "/employees" || pathname.startsWith("/contracts")) {
        return NextResponse.redirect(new URL(empId ? `/employees/${empId}` : "/attendance", request.url));
      }

      if (pathname.startsWith("/working-schedules")) {
        return NextResponse.redirect(new URL("/attendance", request.url));
      }

      // Employees cannot access leave policies or allocations
      if (pathname.startsWith("/time-off/allocations") || pathname.startsWith("/time-off/types")) {
        return NextResponse.redirect(new URL("/time-off/requests", request.url));
      }

      // Employees cannot access payrun processing or salary structures/rules
      if (
        pathname.startsWith("/payroll/payruns") ||
        pathname.startsWith("/payroll/structures") ||
        pathname.startsWith("/payroll/rules")
      ) {
        return NextResponse.redirect(new URL("/payroll/payslips", request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/contracts/:path*",
    "/working-schedules/:path*",
    "/attendance/:path*",
    "/time-off/:path*",
    "/payroll/:path*",
    "/users/:path*",
    "/reports/:path*",
    "/audit-logs/:path*",
  ],
};
