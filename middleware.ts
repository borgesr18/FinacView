import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login","/register","/forgot","/api/openapi","/api/docs","/api/auth/register","/api/etl/import"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }
  const hasAuth = req.cookies.get("sb-access-token") || req.cookies.get("sb:token") || req.cookies.get("sb-session")
  if (!hasAuth) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirectedFrom", pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public).*)"]
}
