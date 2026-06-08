import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const protectedRoutes = [
  "/analise",
  "/clientes",
  "/configuracoes",
  "/contratos",
  "/dashboard",
  "/documentos",
  "/dre",
  "/equipamentos",
  "/financeiro",
  "/juridico",
  "/lancamentos",
  "/manutencoes",
  "/patrimonio",
  "/relatorios",
  "/socios",
]

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtectedRoute(request.nextUrl.pathname) && !user) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
}
