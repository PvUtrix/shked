import { describe, it, expect, beforeEach, afterEach, afterAll, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/homework/route'
import { 
  setupTestDb, 
  cleanupTestDb, 
  disconnectDb, 
  createTestUser, 
  createTestGroup, 
  createTestSubject,
  createTestHomework,
  mockSession,
  isDbAvailable,
  skipIfDbUnavailable 
} from '../../utils/test-helpers'
import { testUsers, testGroups, testSubjects, testHomework } from '../../fixtures'

// Мокаем getServerSession (глобальный мок уже установлен в jest.setup.js)
const { getServerSession } = require('next-auth/next')

describe('API /api/homework', () => {
  let group: any
  let subject: any
  let lector: any
  let student: any
  let admin: any

  beforeAll(async () => {
    await setupTestDb()
  })
  
  beforeEach(async () => {
    if (skipIfDbUnavailable()) {
      // Инициализируем как undefined чтобы тесты не падали
      group = undefined
      subject = undefined
      lector = undefined
      student = undefined
      admin = undefined
      return
    }
    
    await cleanupTestDb()
    jest.clearAllMocks()

    // Создаем базовые данные для тестов
    group = await createTestGroup(testGroups.group1)
    admin = await createTestUser(testUsers.admin)
    lector = await createTestUser(testUsers.lector)
    student = await createTestUser({ ...testUsers.student, groupId: group.id })
    subject = await createTestSubject({ ...testSubjects.programming, lectorId: lector.id })
  })

  afterEach(async () => {
    await cleanupTestDb()
  })

  afterAll(async () => {
    await disconnectDb()
  })

  describe('GET /api/homework', () => {
    it('должен вернуть список домашних заданий для студента (только своя группа)', async () => {
      if (skipIfDbUnavailable()) return
      
      // Создаем ДЗ для группы студента
      const hw1 = await createTestHomework({
        ...testHomework.homework1,
        subjectId: subject.id,
        groupId: group.id,
      })

      // Создаем другую группу и ДЗ для неё
      const otherGroup = await createTestGroup({ ...testGroups.group2, name: 'Другая группа' })
      await createTestHomework({
        ...testHomework.homework2,
        subjectId: subject.id,
        groupId: otherGroup.id,
      })

      getServerSession.mockResolvedValue(mockSession('student', student.id, group.id))

      const request = new NextRequest('http://localhost:3000/api/homework')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.homework).toBeDefined()
      expect(data.homework.length).toBe(1)
      expect(data.homework[0].id).toBe(hw1.id)
      expect(data.homework[0].groupId).toBe(group.id)
    })

    it('должен вернуть список домашних заданий для преподавателя (только свои предметы)', async () => {
      if (skipIfDbUnavailable()) return
      
      // Создаем ДЗ для предмета преподавателя
      const hw1 = await createTestHomework({
        ...testHomework.homework1,
        subjectId: subject.id,
        groupId: group.id,
      })

      // Создаем другой предмет и ДЗ для него
      const otherSubject = await createTestSubject({ 
        ...testSubjects.math, 
        name: 'Другой предмет',
        lectorId: admin.id 
      })
      await createTestHomework({
        ...testHomework.homework2,
        subjectId: otherSubject.id,
        groupId: group.id,
      })

      getServerSession.mockResolvedValue(mockSession('lector', lector.id))

      const request = new NextRequest('http://localhost:3000/api/homework?lector=true')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.homework).toBeDefined()
      expect(data.homework.length).toBe(1)
      expect(data.homework[0].id).toBe(hw1.id)
      expect(data.homework[0].subject.id).toBe(subject.id)
    })

    it('должен фильтровать по предмету', async () => {
      if (skipIfDbUnavailable()) return
      
      const otherSubject = await createTestSubject({ 
        ...testSubjects.math, 
        name: 'Математика',
      })

      await createTestHomework({
        ...testHomework.homework1,
        subjectId: subject.id,
        groupId: group.id,
      })

      const hw2 = await createTestHomework({
        ...testHomework.homework2,
        subjectId: otherSubject.id,
        groupId: group.id,
      })

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest(`http://localhost:3000/api/homework?subjectId=${otherSubject.id}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.homework).toBeDefined()
      expect(data.homework.length).toBe(1)
      expect(data.homework[0].id).toBe(hw2.id)
    })

    it('должен поддерживать пагинацию', async () => {
      if (skipIfDbUnavailable()) return
      
      // Создаем несколько ДЗ
      for (let i = 0; i < 15; i++) {
        await createTestHomework({
          title: `ДЗ ${i}`,
          subjectId: subject.id,
          groupId: group.id,
          deadline: new Date(`2024-12-${(i % 28) + 1}`),
        })
      }

      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const request = new NextRequest('http://localhost:3000/api/homework?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.homework.length).toBe(10)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.total).toBe(15)
      expect(data.pagination.pages).toBe(2)
    })

    it('должен вернуть 401 для неавторизованного пользователя', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/homework')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Не авторизован')
    })
  })

  describe('POST /api/homework', () => {
    it('должен создать домашнее задание (admin)', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const newHomework = {
        title: 'Новое ДЗ',
        description: 'Описание',
        content: '# MDX контент',
        taskUrl: 'https://example.com/task.pdf',
        deadline: new Date('2024-12-31').toISOString(),
        subjectId: subject.id,
        groupId: group.id,
        materials: [
          { name: 'Материал 1', url: 'https://example.com/1.pdf', type: 'document' }
        ],
      }

      const request = new NextRequest('http://localhost:3000/api/homework', {
        method: 'POST',
        body: JSON.stringify(newHomework),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toBeDefined()
      expect(data.title).toBe(newHomework.title)
      expect(data.content).toBe(newHomework.content)
      expect(data.subjectId).toBe(subject.id)
      expect(data.groupId).toBe(group.id)
    })

    it('должен создать домашнее задание (lector)', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('lector', lector.id))

      const newHomework = {
        title: 'ДЗ от преподавателя',
        description: 'Описание',
        deadline: new Date('2024-12-31').toISOString(),
        subjectId: subject.id,
        groupId: group.id,
      }

      const request = new NextRequest('http://localhost:3000/api/homework', {
        method: 'POST',
        body: JSON.stringify(newHomework),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe(newHomework.title)
    })

    it('должен вернуть 403 для студента', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('student', student.id, group.id))

      const newHomework = {
        title: 'Попытка создать ДЗ',
        deadline: new Date('2024-12-31').toISOString(),
        subjectId: subject.id,
      }

      const request = new NextRequest('http://localhost:3000/api/homework', {
        method: 'POST',
        body: JSON.stringify(newHomework),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Доступ запрещен')
    })

    it('должен валидировать обязательные поля', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const invalidHomework = {
        // title отсутствует
        description: 'Описание',
        deadline: new Date('2024-12-31').toISOString(),
      }

      const request = new NextRequest('http://localhost:3000/api/homework', {
        method: 'POST',
        body: JSON.stringify(invalidHomework),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('обязательны')
    })

    it('должен проверять существование предмета', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const homeworkWithInvalidSubject = {
        title: 'ДЗ',
        deadline: new Date('2024-12-31').toISOString(),
        subjectId: 'non-existent-subject-id',
      }

      const request = new NextRequest('http://localhost:3000/api/homework', {
        method: 'POST',
        body: JSON.stringify(homeworkWithInvalidSubject),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Предмет не найден')
    })

    it('должен проверять существование группы', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const homeworkWithInvalidGroup = {
        title: 'ДЗ',
        deadline: new Date('2024-12-31').toISOString(),
        subjectId: subject.id,
        groupId: 'non-existent-group-id',
      }

      const request = new NextRequest('http://localhost:3000/api/homework', {
        method: 'POST',
        body: JSON.stringify(homeworkWithInvalidGroup),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Группа не найдена')
    })

    it('должен сохранять MDX контент корректно', async () => {
      if (skipIfDbUnavailable()) return
      
      getServerSession.mockResolvedValue(mockSession('admin', admin.id))

      const mdxContent = `# Заголовок

Это **жирный** текст и _курсив_.

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`

- Пункт 1
- Пункт 2`

      const newHomework = {
        title: 'ДЗ с MDX',
        content: mdxContent,
        deadline: new Date('2024-12-31').toISOString(),
        subjectId: subject.id,
      }

      const request = new NextRequest('http://localhost:3000/api/homework', {
        method: 'POST',
        body: JSON.stringify(newHomework),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.content).toBe(mdxContent)
    })
  })
})

