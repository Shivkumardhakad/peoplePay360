import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const role = request.nextauth.token?.role;
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/payroll") && role === "EMPLOYEE") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
  matcher: ["/dashboard/:path*", "/employees/:path*", "/contracts/:path*", "/attendance/:path*", "/time-off/:path*", "/payroll/:path*"]
};
