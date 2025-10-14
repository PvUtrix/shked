
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
    
    // Проверка доступа к роутам преподавателя
    if (req.nextUrl.pathname.startsWith('/lector') && 
        req.nextauth.token?.role !== 'lector') {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам ментора
    if (req.nextUrl.pathname.startsWith('/mentor') && 
        req.nextauth.token?.role !== 'mentor') {
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
  matcher: ['/admin/:path*', '/student/:path*', '/lector/:path*', '/mentor/:path*']
}
