import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing in middleware.")
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users to /login
  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Handle authenticated users redirects
  if (user) {
    const role = user.user_metadata?.role

    // If marketer attempts to access any other dashboard route, redirect to /dashboard/marketer
    if (role === "MARKETER" && pathname.startsWith("/dashboard") && pathname !== "/dashboard/marketer") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard/marketer"
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from /login
    if (pathname === "/login") {
      const url = request.nextUrl.clone()
      url.pathname = role === "MARKETER" ? "/dashboard/marketer" : "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
