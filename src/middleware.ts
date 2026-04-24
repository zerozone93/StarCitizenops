import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl
  const isAuth = !!(req as NextRequest & { auth: unknown }).auth

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/operations") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/coalitions") ||
    pathname.startsWith("/ai-planner") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/profile")

  if (isProtected && !isAuth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
