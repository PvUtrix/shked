
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Проверка доступа к админ роутам
    if (req.nextUrl.pathname.startsWith('/admin') && 
        req.nextauth.token?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к студенческим роутам
    if (req.nextUrl.pathname.startsWith('/student') && 
        req.nextauth.token?.role !== 'student') {
      return new Response('Forbidden', { status: 403 })
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/student/:path*']
}
