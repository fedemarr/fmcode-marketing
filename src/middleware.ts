import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cs) {
          cs.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cs.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register")
  const isApiRoute = path.startsWith("/api/")
  const isWebhook = path.startsWith("/api/webhooks/")

  // Webhooks no requieren auth
  if (isWebhook) return supabaseResponse

  // API routes: devolver 401 JSON si no hay sesión
  if (isApiRoute && !user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } },
      { status: 401 }
    )
  }

  // Si está logueado y va al login/register → dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Si no está logueado y va a ruta protegida → login
  if (!user && !isAuthPage && !isApiRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
