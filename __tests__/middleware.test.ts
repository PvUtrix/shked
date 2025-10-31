import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import middleware from '@/middleware'

// Мокаем next-auth/middleware
jest.mock('next-auth/middleware', () => {
  return {
    withAuth: (middlewareFunc: any, options: any) => {
      return async (req: any) => {
        // Проверяем authorized callback
        if (options.callbacks?.authorized) {
          const isAuthorized = options.callbacks.authorized({ token: req.nextauth?.token })
          if (!isAuthorized) {
            // Редирект на логин, если не авторизован
            return NextResponse.redirect(new URL('/login', req.url))
          }
        }
        
        // Вызываем основной middleware
        return middlewareFunc(req)
      }
    },
  }
})

describe('Middleware', () => {
  // Хелпер для создания mock request
  function createRequest(path: string, token?: any) {
    const url = `http://localhost:3000${path}`
    const request = new NextRequest(url)
    
    // Добавляем mock token
    if (token) {
      ;(request as any).nextauth = { token }
    }
    
    return request
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Доступ к /admin/*', () => {
    it('должен разрешить доступ для admin роли', async () => {
      const request = createRequest('/admin/users', { role: 'admin' })
      const response = await middleware(request as any, {} as any)
      
      // Middleware не должен вернуть 403
      expect(response).toBeUndefined() // undefined означает что запрос пропущен
    })

    it('должен вернуть 403 для student роли', async () => {
      const request = createRequest('/admin/users', { role: 'student' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
        expect(await response.text()).toBe('Forbidden')
      }
    })

    it('должен вернуть 403 для lector роли', async () => {
      const request = createRequest('/admin/schedule', { role: 'lector' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })

    it('должен вернуть 403 для mentor роли', async () => {
      const request = createRequest('/admin/subjects', { role: 'mentor' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })
  })

  describe('Доступ к /student/*', () => {
    it('должен разрешить доступ для student роли', async () => {
      const request = createRequest('/student/homework', { role: 'student' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeUndefined()
    })

    it('должен вернуть 403 для admin роли', async () => {
      const request = createRequest('/student/homework', { role: 'admin' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })

    it('должен вернуть 403 для lector роли', async () => {
      const request = createRequest('/student/profile', { role: 'lector' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })
  })

  describe('Доступ к /lector/*', () => {
    it('должен разрешить доступ для lector роли', async () => {
      const request = createRequest('/lector/homework', { role: 'lector' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeUndefined()
    })

    it('должен вернуть 403 для student роли', async () => {
      const request = createRequest('/lector/homework', { role: 'student' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })

    it('должен вернуть 403 для mentor роли', async () => {
      const request = createRequest('/lector/profile', { role: 'mentor' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })
  })

  describe('Доступ к /mentor/*', () => {
    it('должен разрешить доступ для mentor роли', async () => {
      const request = createRequest('/mentor/students', { role: 'mentor' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeUndefined()
    })

    it('должен вернуть 403 для student роли', async () => {
      const request = createRequest('/mentor/students', { role: 'student' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })

    it('должен вернуть 403 для lector роли', async () => {
      const request = createRequest('/mentor/homework', { role: 'lector' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(403)
      }
    })
  })

  describe('Неавторизованный доступ', () => {
    it('должен редиректить на /login при отсутствии токена', async () => {
      const request = createRequest('/admin/users')
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(307) // Временный редирект
        expect(response.headers.get('location')).toContain('/login')
      }
    })
  })

  describe('Matcher конфигурация', () => {
    // Тест на то, что middleware применяется только к определенным путям
    it('должен применяться только к /admin/*, /student/*, /lector/*, /mentor/*', () => {
      // Импортируем config из middleware
      const { config } = require('@/middleware')
      
      expect(config.matcher).toBeDefined()
      expect(config.matcher).toEqual(['/admin/:path*', '/student/:path*', '/lector/:path*', '/mentor/:path*'])
    })
  })

  describe('Edge cases', () => {
    it('должен обрабатывать путь с несколькими сегментами', async () => {
      const request = createRequest('/admin/users/123/edit', { role: 'admin' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeUndefined()
    })

    it('должен обрабатывать query параметры', async () => {
      const request = createRequest('/admin/users?page=1&limit=10', { role: 'admin' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeUndefined()
    })

    it('должен обрабатывать hash в URL', async () => {
      const request = createRequest('/admin/users#section', { role: 'admin' })
      const response = await middleware(request as any, {} as any)
      
      expect(response).toBeUndefined()
    })
  })
})

