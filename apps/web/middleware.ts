import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const role = request.nextauth.token?.role;
    const pathname = request.nextUrl.pathname;

    if (role === "EMPLOYEE") {
      const employeeRoutes = ["/self"];
      const redirectedEmployeeRoutes: Record<string, string> = {
        "/dashboard": "/self/dashboard",
        "/attendance": "/self/attendance",
        "/time-off": "/self/time-off"
      };

      if (employeeRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
        return NextResponse.next();
      }

      for (const [adminRoute, selfRoute] of Object.entries(redirectedEmployeeRoutes)) {
        if (pathname === adminRoute || pathname.startsWith(`${adminRoute}/`)) {
          return NextResponse.redirect(new URL(selfRoute, request.url));
        }
      }

      if (pathname.startsWith("/employees") || pathname.startsWith("/contracts") || pathname.startsWith("/payroll") || pathname.startsWith("/users")) {
        return NextResponse.redirect(new URL("/self/dashboard", request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token)
    },
    pages: {
      signIn: "/login"
    }
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/employees/:path*", "/contracts/:path*", "/attendance/:path*", "/time-off/:path*", "/payroll/:path*", "/users/:path*", "/self/:path*"]
};
