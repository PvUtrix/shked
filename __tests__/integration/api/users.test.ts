import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/users/route'
import { setupTestDb, cleanupTestDb, disconnectDb, createTestUser, createTestGroup, mockSession, isDbAvailable, skipIfDbUnavailable } from '../../utils/test-helpers'
import { testUsers, testGroups } from '../../fixtures'

// Мокаем getServerSession (глобальный мок уже установлен в jest.setup.js)
const { getServerSession } = require('next-auth/next')

describe('API /api/users', () => {
  beforeAll(async () => {
    await setupTestDb()
  })
  
  beforeEach(async () => {
    if (!isDbAvailable()) {
      return
    }
    await cleanupTestDb()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await disconnectDb()
  })

  describe('GET /api/users', () => {
    it('должен вернуть список пользователей для авторизованного пользователя', async () => {
      if (skipIfDbUnavailable()) return
      if (skipIfDbUnavailable()) return
      // Создаем тестовых пользователей
      const admin = await createTestUser(testUsers.admin)
      await createTestUser(testUsers.student)
      await createTestUser(testUsers.lector)

      // Мокаем сессию админа
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(data.users.length).toBeGreaterThanOrEqual(3)
    })

    it('должен вернуть 401 для неавторизованного пользователя', async () => {
      if (skipIfDbUnavailable()) return
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/users')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Не авторизован')
    })

    it('должен фильтровать пользователей по роли', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      await createTestUser(testUsers.student)
      await createTestUser({ ...testUsers.lector, email: 'lector2@test.com' })

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/users?role=lector')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(data.users.every((u: any) => u.role === 'lector')).toBe(true)
    })

    it('должен фильтровать пользователей по группе', async () => {
      if (skipIfDbUnavailable()) return
      const group = await createTestGroup(testGroups.group1)
      const admin = await createTestUser(testUsers.admin)
      await createTestUser({ ...testUsers.student, groupId: group.id })
      await createTestUser({ ...testUsers.lector, email: 'student2@test.com' })

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest(`http://localhost:3000/api/users?groupId=${group.id}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(data.users.every((u: any) => u.groupId === group.id)).toBe(true)
    })
  })

  describe('POST /api/users', () => {
    it('должен создать нового пользователя (только admin)', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const newUser = {
        email: 'newuser@test.com',
        password: 'NewUser123!',
        name: 'New User',
        role: 'student',
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(newUser.email)
      expect(data.user.role).toBe('student')
    })

    it('должен вернуть 403 для non-admin пользователя', async () => {
      if (skipIfDbUnavailable()) return
      const student = await createTestUser(testUsers.student)
      getServerSession.mockResolvedValue(mockSession('student', student.id))

      const newUser = {
        email: 'newuser@test.com',
        password: 'NewUser123!',
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Доступ запрещен')
    })

    it('должен валидировать обязательные поля', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const invalidUser = {
        email: 'test@test.com',
        // password отсутствует
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(invalidUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('обязательны')
    })

    it('должен отклонить создание пользователя с существующим email', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      await createTestUser(testUsers.student)
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const duplicateUser = {
        email: testUsers.student.email, // Уже существует
        password: 'SomePassword123!',
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(duplicateUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('уже существует')
    })

    it('должен проверять существование группы при создании', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const userWithInvalidGroup = {
        email: 'test@test.com',
        password: 'Test123!',
        groupId: 'non-existent-group-id',
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(userWithInvalidGroup),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Группа не найдена')
    })
  })

  describe('PUT /api/users', () => {
    it('должен обновить пользователя (только admin)', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      const student = await createTestUser(testUsers.student)
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const updates = {
        id: student.id,
        name: 'Updated Name',
        firstName: 'Updated',
        lastName: 'Name',
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.name).toBe('Updated Name')
      expect(data.user.firstName).toBe('Updated')
    })

    it('должен вернуть 403 для non-admin пользователя', async () => {
      if (skipIfDbUnavailable()) return
      const student = await createTestUser(testUsers.student)
      getServerSession.mockResolvedValue(mockSession('student', student.id))

      const updates = {
        id: student.id,
        name: 'Hacked Name',
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Доступ запрещен')
    })

    it('должен требовать ID пользователя', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const updates = {
        // id отсутствует
        name: 'Some Name',
      }

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('ID пользователя обязателен')
    })
  })

  describe('DELETE /api/users', () => {
    it('должен деактивировать пользователя (только admin)', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      const student = await createTestUser(testUsers.student)
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest(`http://localhost:3000/api/users?id=${student.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('деактивирован')
    })

    it('должен вернуть 403 для non-admin пользователя', async () => {
      if (skipIfDbUnavailable()) return
      const student = await createTestUser(testUsers.student)
      const anotherStudent = await createTestUser({ ...testUsers.lector, email: 'another@test.com', role: 'student' })
      
      getServerSession.mockResolvedValue(mockSession('student', student.id))

      const request = new NextRequest(`http://localhost:3000/api/users?id=${anotherStudent.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Доступ запрещен')
    })

    it('должен требовать ID пользователя', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('ID пользователя обязателен')
    })

    it('должен вернуть 404 для несуществующего пользователя', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/users?id=non-existent-id', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('не найден')
    })

    it('не должен позволять админу удалить самого себя', async () => {
      if (skipIfDbUnavailable()) return
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest(`http://localhost:3000/api/users?id=${admin.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Нельзя удалить самого себя')
    })
  })
})

