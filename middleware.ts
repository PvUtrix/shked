
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role
    
    // Проверка доступа к админ роутам
    if (req.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к студенческим роутам
    if (req.nextUrl.pathname.startsWith('/student') && role !== 'student') {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам преподавателя (lector)
    if (req.nextUrl.pathname.startsWith('/lector') && 
        role !== 'lector' && role !== 'admin') {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам ментора
    if (req.nextUrl.pathname.startsWith('/mentor') && 
        !['mentor', 'admin'].includes(role as string || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам ассистента
    if (req.nextUrl.pathname.startsWith('/assistant') && 
        !['assistant', 'lector', 'admin'].includes(role as string || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам соведущего
    if (req.nextUrl.pathname.startsWith('/co-lecturer') && 
        !['co_lecturer', 'lector', 'admin'].includes(role as string || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам руководителя обр. офиса
    if (req.nextUrl.pathname.startsWith('/education-office') && 
        !['education_office_head', 'admin'].includes(role as string || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам администрации кафедры
    if (req.nextUrl.pathname.startsWith('/department') && 
        !['department_admin', 'admin'].includes(role as string || '')) {
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
  matcher: [
    '/admin/:path*', 
    '/student/:path*', 
    '/lector/:path*',
    '/mentor/:path*',
    '/assistant/:path*',
    '/co-lecturer/:path*',
    '/education-office/:path*',
    '/department/:path*'
  ]
}
