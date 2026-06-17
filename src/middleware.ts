import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/")
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
  const isLoginPage = req.nextUrl.pathname === "/login"

  // Las rutas de auth siempre pasan
  if (isAuthRoute) return NextResponse.next()

  // Las rutas API devuelven 401 JSON en vez de redirigir al login
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } },
      { status: 401 }
    )
  }

  // Si está logueado y va al login, redirige al dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Si no está logueado y no es login, redirige al login
  if (!isLoggedIn && !isLoginPage && !isApiRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
