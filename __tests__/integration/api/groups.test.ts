import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/groups/route'
import { setupTestDb, cleanupTestDb, disconnectDb, createTestUser, createTestGroup, mockSession } from '../../utils/test-helpers'
import { testUsers, testGroups } from '../../fixtures'

// Мокаем getServerSession
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

const { getServerSession } = require('next-auth/next')

describe('API /api/groups', () => {
  beforeEach(async () => {
    await setupTestDb()
    await cleanupTestDb()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await disconnectDb()
  })

  describe('GET /api/groups', () => {
    it('должен вернуть список групп для авторизованного пользователя', async () => {
      const admin = await createTestUser(testUsers.admin)
      await createTestGroup(testGroups.group1)
      await createTestGroup(testGroups.group2)

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/groups')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.groups).toBeDefined()
      expect(data.groups.length).toBeGreaterThanOrEqual(2)
    })

    it('должен вернуть 401 для неавторизованного пользователя', async () => {
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/groups')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Не авторизован')
    })

    it('должен включать количество пользователей и расписаний', async () => {
      const admin = await createTestUser(testUsers.admin)
      const group = await createTestGroup(testGroups.group1)

      // Создаем студента в группе
      await createTestUser({ ...testUsers.student, groupId: group.id })

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/groups')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const foundGroup = data.groups.find((g: any) => g.id === group.id)
      expect(foundGroup._count).toBeDefined()
      expect(foundGroup._count.users).toBeGreaterThan(0)
    })

    it('должен возвращать пользователей группы', async () => {
      const admin = await createTestUser(testUsers.admin)
      const group = await createTestGroup(testGroups.group1)
      const student = await createTestUser({ ...testUsers.student, groupId: group.id })

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/groups')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const foundGroup = data.groups.find((g: any) => g.id === group.id)
      expect(foundGroup.users).toBeDefined()
      expect(foundGroup.users.length).toBeGreaterThan(0)
      expect(foundGroup.users[0].email).toBe(student.email)
    })
  })

  describe('POST /api/groups', () => {
    it('должен создать новую группу (только admin)', async () => {
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const newGroup = {
        name: 'Новая группа Б01-999',
        description: 'Тестовая группа',
        semester: '1',
        year: '2024',
      }

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify(newGroup),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(newGroup.name)
      expect(data.description).toBe(newGroup.description)
      expect(data.semester).toBe(newGroup.semester)
      expect(data.year).toBe(newGroup.year)
    })

    it('должен вернуть 403 для non-admin пользователя', async () => {
      const student = await createTestUser(testUsers.student)
      getServerSession.mockResolvedValue(mockSession('student', student.id))

      const newGroup = {
        name: 'Новая группа',
      }

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify(newGroup),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Доступ запрещен')
    })

    it('должен валидировать обязательное поле name', async () => {
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const invalidGroup = {
        // name отсутствует
        description: 'Описание',
      }

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify(invalidGroup),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('обязательно')
    })

    it('должен создавать группу с минимальными данными', async () => {
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const minimalGroup = {
        name: 'Минимальная группа',
      }

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'POST',
        body: JSON.stringify(minimalGroup),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(minimalGroup.name)
      expect(data._count).toBeDefined()
    })
  })

  describe('PUT /api/groups', () => {
    it('должен обновить группу (только admin)', async () => {
      const admin = await createTestUser(testUsers.admin)
      const group = await createTestGroup(testGroups.group1)

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const updates = {
        id: group.id,
        name: 'Обновленное название',
        description: 'Обновленное описание',
        semester: '2',
        year: '2025',
      }

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe(updates.name)
      expect(data.description).toBe(updates.description)
      expect(data.semester).toBe(updates.semester)
    })

    it('должен вернуть 403 для non-admin пользователя', async () => {
      const student = await createTestUser(testUsers.student)
      const group = await createTestGroup(testGroups.group1)

      getServerSession.mockResolvedValue(mockSession('student', student.id))

      const updates = {
        id: group.id,
        name: 'Взломанное название',
      }

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Доступ запрещен')
    })

    it('должен требовать ID группы', async () => {
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const updates = {
        // id отсутствует
        name: 'Новое название',
      }

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'PUT',
        body: JSON.stringify(updates),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('ID группы обязателен')
    })
  })

  describe('DELETE /api/groups', () => {
    it('должен деактивировать группу (только admin)', async () => {
      const admin = await createTestUser(testUsers.admin)
      const group = await createTestGroup(testGroups.group1)

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest(`http://localhost:3000/api/groups?id=${group.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('удалена')
    })

    it('должен вернуть 403 для non-admin пользователя', async () => {
      const student = await createTestUser(testUsers.student)
      const group = await createTestGroup(testGroups.group1)

      getServerSession.mockResolvedValue(mockSession('student', student.id))

      const request = new NextRequest(`http://localhost:3000/api/groups?id=${group.id}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Доступ запрещен')
    })

    it('должен требовать ID группы', async () => {
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/groups', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('ID группы обязателен')
    })

    it('должен вернуть 404 для несуществующей группы', async () => {
      const admin = await createTestUser(testUsers.admin)
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/groups?id=non-existent-id', {
        method: 'DELETE',
      })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('не найдена')
    })
  })
})

