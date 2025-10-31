
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
    
    // Проверка доступа к роутам преподавателя (teacher заменяет lector)
    if (req.nextUrl.pathname.startsWith('/teacher') && 
        !['teacher', 'lector', 'admin'].includes(role || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Поддержка старых роутов /lector (редирект на /teacher)
    if (req.nextUrl.pathname.startsWith('/lector')) {
      const newPath = req.nextUrl.pathname.replace('/lector', '/teacher')
      return Response.redirect(new URL(newPath + req.nextUrl.search, req.url))
    }
    
    // Проверка доступа к роутам ментора
    if (req.nextUrl.pathname.startsWith('/mentor') && 
        !['mentor', 'admin'].includes(role || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам ассистента
    if (req.nextUrl.pathname.startsWith('/assistant') && 
        !['assistant', 'teacher', 'admin'].includes(role || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам соведущего
    if (req.nextUrl.pathname.startsWith('/co-teacher') && 
        !['co_teacher', 'teacher', 'admin'].includes(role || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам руководителя обр. офиса
    if (req.nextUrl.pathname.startsWith('/education-office') && 
        !['education_office_head', 'admin'].includes(role || '')) {
      return new Response('Forbidden', { status: 403 })
    }
    
    // Проверка доступа к роутам администрации кафедры
    if (req.nextUrl.pathname.startsWith('/department') && 
        !['department_admin', 'admin'].includes(role || '')) {
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
    '/teacher/:path*',
    '/lector/:path*', // Редирект старых роутов
    '/mentor/:path*',
    '/assistant/:path*',
    '/co-teacher/:path*',
    '/education-office/:path*',
    '/department/:path*'
  ]
}
