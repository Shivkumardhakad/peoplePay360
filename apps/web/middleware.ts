import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const role = request.nextauth.token?.role;
    const pathname = request.nextUrl.pathname;

    // Team & Roles (/users) is strictly ADMIN only
    if (pathname.startsWith("/users") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // HR_MANAGER has no payroll access
    if (pathname.startsWith("/payroll") && role === "HR_MANAGER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // EMPLOYEE cannot access payroll processing (payruns, structures, rules), but can access payslips
    if (
      (pathname.startsWith("/payroll/payruns") ||
        pathname.startsWith("/payroll/structures") ||
        pathname.startsWith("/payroll/rules")) &&
      role === "EMPLOYEE"
    ) {
      return NextResponse.redirect(new URL("/payroll/payslips", request.url));
    }

    // EMPLOYEE cannot access administrative /dashboard
    if (pathname === "/dashboard" && role === "EMPLOYEE") {
      const empId = request.nextauth.token?.employeeId;
      return NextResponse.redirect(new URL(empId ? `/employees/${empId}` : "/employees", request.url));
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
    "/attendance/:path*",
    "/time-off/:path*",
    "/payroll/:path*",
    "/users/:path*",
  ],
};
