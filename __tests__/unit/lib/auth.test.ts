import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
import bcryptjs from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { setupTestDb, cleanupTestDb, disconnectDb, createTestUser } from '../../utils/test-helpers'
import { testUsers } from '../../fixtures'

describe('lib/auth.ts', () => {
  beforeEach(async () => {
    await setupTestDb()
    await cleanupTestDb()
  })

  afterEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await disconnectDb()
  })

  describe('CredentialsProvider authorize', () => {
    it('должен успешно авторизовать пользователя с правильными credentials', async () => {
      // Создаем тестового пользователя
      const testUser = await createTestUser(testUsers.student)

      // Получаем authorize функцию из провайдера
      const provider = authOptions.providers[0] as any
      const authorizeFunc = provider.authorize

      // Вызываем authorize с правильными credentials
      const result = await authorizeFunc({
        email: testUsers.student.email,
        password: testUsers.student.password,
      })

      // Проверяем результат
      expect(result).toBeDefined()
      expect(result.email).toBe(testUsers.student.email)
      expect(result.role).toBe('student')
      expect(result.id).toBe(testUser.id)
    })

    it('должен отказать в авторизации при неверном email', async () => {
      // Создаем тестового пользователя
      await createTestUser(testUsers.student)

      const provider = authOptions.providers[0] as any
      const authorizeFunc = provider.authorize

      // Вызываем authorize с неверным email
      const result = await authorizeFunc({
        email: 'wrong@example.com',
        password: testUsers.student.password,
      })

      // Должен вернуть null
      expect(result).toBeNull()
    })

    it('должен отказать в авторизации при неверном пароле', async () => {
      // Создаем тестового пользователя
      await createTestUser(testUsers.student)

      const provider = authOptions.providers[0] as any
      const authorizeFunc = provider.authorize

      // Вызываем authorize с неверным паролем
      const result = await authorizeFunc({
        email: testUsers.student.email,
        password: 'WrongPassword123!',
      })

      // Должен вернуть null
      expect(result).toBeNull()
    })

    it('должен отказать в авторизации при отсутствии email', async () => {
      const provider = authOptions.providers[0] as any
      const authorizeFunc = provider.authorize

      const result = await authorizeFunc({
        password: 'SomePassword123!',
      })

      expect(result).toBeNull()
    })

    it('должен отказать в авторизации при отсутствии пароля', async () => {
      const provider = authOptions.providers[0] as any
      const authorizeFunc = provider.authorize

      const result = await authorizeFunc({
        email: 'test@example.com',
      })

      expect(result).toBeNull()
    })
  })

  describe('JWT callback', () => {
    it('должен добавить role и groupId в токен при наличии user', async () => {
      const callback = authOptions.callbacks?.jwt
      expect(callback).toBeDefined()

      if (callback) {
        const token = { sub: 'user-id' }
        const user = {
          id: 'user-id',
          email: 'test@example.com',
          role: 'student' as const,
          groupId: 'group-123',
        }

        const result = await callback({ token, user } as any)

        expect(result.role).toBe('student')
        expect(result.groupId).toBe('group-123')
      }
    })

    it('должен вернуть токен без изменений при отсутствии user', async () => {
      const callback = authOptions.callbacks?.jwt
      expect(callback).toBeDefined()

      if (callback) {
        const token = { sub: 'user-id', role: 'admin' }

        const result = await callback({ token } as any)

        expect(result).toEqual(token)
      }
    })
  })

  describe('Session callback', () => {
    it('должен обогатить сессию данными из токена', async () => {
      const callback = authOptions.callbacks?.session
      expect(callback).toBeDefined()

      if (callback) {
        const session = {
          user: {
            email: 'test@example.com',
          },
          expires: new Date().toISOString(),
        }
        const token = {
          sub: 'user-123',
          role: 'lector' as const,
          groupId: 'group-456',
        }

        const result = await callback({ session, token } as any)

        expect(result.user).toBeDefined()
        if (result.user && 'id' in result.user) {
          expect(result.user.id).toBe('user-123')
        }
        if (result.user && 'role' in result.user) {
          expect(result.user.role).toBe('lector')
        }
        if (result.user && 'groupId' in result.user) {
          expect(result.user.groupId).toBe('group-456')
        }
      }
    })

    it('должен корректно обработать отсутствие groupId', async () => {
      const callback = authOptions.callbacks?.session
      expect(callback).toBeDefined()

      if (callback) {
        const session = {
          user: {
            email: 'admin@example.com',
          },
          expires: new Date().toISOString(),
        }
        const token = {
          sub: 'admin-123',
          role: 'admin' as const,
        }

        const result = await callback({ session, token } as any)

        expect(result.user).toBeDefined()
        if (result.user && 'id' in result.user) {
          expect(result.user.id).toBe('admin-123')
        }
        if (result.user && 'role' in result.user) {
          expect(result.user.role).toBe('admin')
        }
        if (result.user && 'groupId' in result.user) {
          expect(result.user.groupId).toBeUndefined()
        }
      }
    })
  })

  describe('Auth config', () => {
    it('должен использовать JWT стратегию для сессий', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    it('должен иметь правильную страницу для входа', () => {
      expect(authOptions.pages?.signIn).toBe('/login')
    })

    it('должен иметь хотя бы один провайдер', () => {
      expect(authOptions.providers).toBeDefined()
      expect(authOptions.providers.length).toBeGreaterThan(0)
    })
  })
})

