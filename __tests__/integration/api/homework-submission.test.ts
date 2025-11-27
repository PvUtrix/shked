import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST, PUT } from '@/app/api/homework/[id]/submit/route'
import { 
  setupTestDb, 
  cleanupTestDb, 
  disconnectDb, 
  createTestUser, 
  createTestGroup, 
  createTestSubject,
  createTestHomework,
  mockSession,
  skipIfDbUnavailable 
} from '../../utils/test-helpers'
import { testUsers, testGroups, testSubjects, testHomework } from '../../fixtures'

// Мокаем getServerSession
const { getServerSession } = require('next-auth/next')

describe('API /api/homework/[id]/submit', () => {
  let group: any
  let subject: any
  let lector: any
  let student: any
  let homework: any

  beforeAll(async () => {
    await setupTestDb()
  })
  
  beforeEach(async () => {
    if (skipIfDbUnavailable()) return
    
    await cleanupTestDb()
    jest.clearAllMocks()

    // Создаем базовые данные
    group = await createTestGroup(testGroups.group1)
    lector = await createTestUser(testUsers.lector)
    student = await createTestUser({ ...testUsers.student, groupId: group.id })
    subject = await createTestSubject({ ...testSubjects.programming, lectorId: lector.id })
    homework = await createTestHomework({
      ...testHomework.homework1,
      subjectId: subject.id,
      groupId: group.id,
      deadline: new Date(Date.now() + 86400000), // Завтра
    })
  })

  afterEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await disconnectDb()
  })

  describe('POST /api/homework/[id]/submit', () => {
    it('должен успешно сдать задание', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('student', student.id, group.id))

      const submissionData = {
        content: '# Мое решение',
        submissionUrl: 'https://github.com/student/repo'
      }

      const request = new NextRequest(`http://localhost:3000/api/homework/${homework.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionData),
      })

      const params = Promise.resolve({ id: homework.id })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.content).toBe(submissionData.content)
      expect(data.submissionUrl).toBe(submissionData.submissionUrl)
      expect(data.status).toBe('SUBMITTED')
    })

    it('должен вернуть ошибку если дедлайн прошел', async () => {
      if (skipIfDbUnavailable()) return

      // Создаем просроченное ДЗ
      const overdueHomework = await createTestHomework({
        title: 'Просроченное ДЗ',
        subjectId: subject.id,
        groupId: group.id,
        deadline: new Date(Date.now() - 86400000), // Вчера
      })
      
      getServerSession.mockResolvedValue(mockSession('student', student.id, group.id))

      const submissionData = {
        content: '# Мое решение'
      }

      const request = new NextRequest(`http://localhost:3000/api/homework/${overdueHomework.id}/submit`, {
        method: 'POST',
        body: JSON.stringify(submissionData),
      })

      const params = Promise.resolve({ id: overdueHomework.id })
      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Дедлайн истек')
    })

    it('должен вернуть ошибку если нет контента и ссылки', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('student', student.id, group.id))

      const request = new NextRequest(`http://localhost:3000/api/homework/${homework.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const params = Promise.resolve({ id: homework.id })
      const response = await POST(request, { params })
      
      expect(response.status).toBe(400)
    })
  })

  describe('PUT /api/homework/[id]/submit', () => {
    it('должен успешно обновить задание', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('student', student.id, group.id))

      // Сначала создаем submission
      const request1 = new NextRequest(`http://localhost:3000/api/homework/${homework.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content: 'Initial' }),
      })
      const params = Promise.resolve({ id: homework.id })
      await POST(request1, { params })

      // Теперь обновляем
      const updateData = {
        content: 'Updated content',
        submissionUrl: 'https://github.com/student/repo'
      }

      const request2 = new NextRequest(`http://localhost:3000/api/homework/${homework.id}/submit`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request2, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.content).toBe(updateData.content)
      expect(data.submissionUrl).toBe(updateData.submissionUrl)
    })
  })
})
