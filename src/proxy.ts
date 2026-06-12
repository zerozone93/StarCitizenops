import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-flags";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // If 2FA is pending and user is not already on the verify page, redirect there.
    if (
      TWO_FACTOR_ENABLED &&
      token?.twoFactorPending === true &&
      pathname !== "/2fa-verify" &&
      !pathname.startsWith("/api/2fa") &&
      !pathname.startsWith("/api/auth")
    ) {
      const url = req.nextUrl.clone();
      url.pathname = "/2fa-verify";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/fleet/:path*",
    "/fleet",
    "/profile/:path*",
    "/organizations/:path*",
    "/operations/:path*",
    "/ai-planner/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/coalitions/:path*",
    "/social/:path*",
    "/2fa-verify",
  ],
};
