import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Middleware to handle authentication and password change enforcement
 * Runs on every request to protected routes
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/api/auth',
    '/api/health',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/logo.svg',
  ]

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If accessing a public route, allow it
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Password change enforcement
  // If user must change password, only allow access to change-password page and logout
  const mustChangePassword = token.mustChangePassword === true
  const isChangePasswordPage = pathname === '/change-password'
  const isApiRoute = pathname.startsWith('/api')
  const isLogoutRoute = pathname.startsWith('/api/auth/signout')

  if (mustChangePassword && !isChangePasswordPage && !isLogoutRoute) {
    // Allow API routes for changing password
    if (isApiRoute && pathname.startsWith('/api/users/change-password')) {
      return NextResponse.next()
    }

    // For page routes, redirect to change password page
    if (!isApiRoute) {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }

    // For other API routes, return 403
    return NextResponse.json(
      {
        error: {
          code: 'MUST_CHANGE_PASSWORD',
          message: 'You must change your password before continuing',
          statusCode: 403,
        },
      },
      { status: 403 }
    )
  }

  // Role-based route protection
  const userRole = token.role as string

  // Admin-only routes
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Lector-only routes
  if (pathname.startsWith('/lector') && !['admin', 'lector'].includes(userRole)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Mentor-only routes
  if (pathname.startsWith('/mentor') && !['admin', 'mentor'].includes(userRole)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Student-only routes
  if (pathname.startsWith('/student') && !['admin', 'student'].includes(userRole)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|logo.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
