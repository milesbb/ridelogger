import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/signup", "/"]

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }
  // Access token is in sessionStorage (client-only), so we check the httpOnly
  // refresh-token cookie as a proxy. The real auth boundary is the API rejecting
  // requests without a valid Bearer token.
  const hasRefreshToken = req.cookies.has("refreshToken")
  if (!hasRefreshToken) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
