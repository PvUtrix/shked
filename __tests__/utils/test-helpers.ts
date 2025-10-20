import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { jest } from '@jest/globals'

// Prisma клиент для тестов
let prisma: PrismaClient

/**
 * Получить Prisma клиент для тестов
 * Использует существующую базу данных из переменной окружения
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    // Используем стандартный Prisma клиент из lib/db
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { prisma: dbPrisma } = require('@/lib/db')
    prisma = dbPrisma
  }
  return prisma
}

/**
 * Инициализация тестовой БД
 * Просто убеждаемся что подключение работает
 */
export async function setupTestDb() {
  const prisma = getPrismaClient()
  
  try {
    await prisma.$connect()
  } catch (error) {
    console.warn('Не удалось подключиться к тестовой БД. Убедитесь что PostgreSQL запущен.')
  }
}

/**
 * Очистка тестовой БД
 */
export async function cleanupTestDb() {
  const prisma = getPrismaClient()
  
  // Удаляем все данные из таблиц в правильном порядке (из-за foreign keys)
  await prisma.homeworkSubmission.deleteMany()
  await prisma.homework.deleteMany()
  await prisma.schedule.deleteMany()
  await prisma.userGroup.deleteMany()
  await prisma.telegramUser.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.group.deleteMany()
  await prisma.botSettings.deleteMany()
  await prisma.verificationToken.deleteMany()
}

/**
 * Отключение от БД
 */
export async function disconnectDb() {
  const prisma = getPrismaClient()
  await prisma.$disconnect()
}

/**
 * Создание тестового пользователя
 */
export async function createTestUser(data: {
  email: string
  password: string
  role: 'admin' | 'student' | 'lector' | 'mentor'
  name?: string
  firstName?: string
  lastName?: string
  groupId?: string
}) {
  const prisma = getPrismaClient()
  const hashedPassword = await bcryptjs.hash(data.password, 10)
  
  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role,
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      groupId: data.groupId,
    },
  })
}

/**
 * Создание тестовой группы
 */
export async function createTestGroup(data: {
  name: string
  description?: string
  semester?: string
  year?: string
}) {
  const prisma = getPrismaClient()
  
  return await prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      semester: data.semester,
      year: data.year,
    },
  })
}

/**
 * Создание тестового предмета
 */
export async function createTestSubject(data: {
  name: string
  description?: string
  instructor?: string
  lectorId?: string
}) {
  const prisma = getPrismaClient()
  
  return await prisma.subject.create({
    data: {
      name: data.name,
      description: data.description,
      instructor: data.instructor,
      lectorId: data.lectorId,
    },
  })
}

/**
 * Создание тестового домашнего задания
 */
export async function createTestHomework(data: {
  title: string
  description?: string
  content?: string
  taskUrl?: string
  deadline: Date
  subjectId: string
  groupId?: string
  materials?: any[]
}) {
  const prisma = getPrismaClient()
  
  return await prisma.homework.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      taskUrl: data.taskUrl,
      deadline: data.deadline,
      subjectId: data.subjectId,
      groupId: data.groupId,
      materials: data.materials || [],
    },
  })
}

/**
 * Создание тестового расписания
 */
export async function createTestSchedule(data: {
  subjectId: string
  groupId?: string
  subgroupId?: string
  date: Date
  dayOfWeek: number
  startTime: string
  endTime: string
  location?: string
  eventType?: string
  description?: string
}) {
  const prisma = getPrismaClient()
  
  return await prisma.schedule.create({
    data: {
      subjectId: data.subjectId,
      groupId: data.groupId,
      subgroupId: data.subgroupId,
      date: data.date,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      eventType: data.eventType,
      description: data.description,
    },
  })
}

/**
 * Мок сессии NextAuth
 */
export function mockSession(role: 'admin' | 'student' | 'lector' | 'mentor', userId?: string, groupId?: string) {
  return {
    user: {
      id: userId || 'test-user-id',
      email: `test-${role}@example.com`,
      name: `Test ${role}`,
      role: role,
      groupId: groupId,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Мок для Telegram API
 */
export function mockTelegramAPI() {
  return {
    sendMessage: jest.fn().mockResolvedValue({ ok: true } as any),
    editMessage: jest.fn().mockResolvedValue({ ok: true } as any),
    answerCallbackQuery: jest.fn().mockResolvedValue({ ok: true } as any),
    setWebhook: jest.fn().mockResolvedValue({ ok: true } as any),
    getWebhookInfo: jest.fn().mockResolvedValue({ 
      ok: true, 
      result: { url: 'https://example.com/webhook' } 
    } as any),
    getBotInfo: jest.fn().mockResolvedValue({ 
      ok: true, 
      result: { id: 123456, first_name: 'TestBot' } 
    } as any),
  }
}

/**
 * Создание mock request для API routes
 */
export function createMockRequest(options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: any
  cookies?: Record<string, string>
}) {
  const url = options.url || 'http://localhost:3000/api/test'
  const request = {
    method: options.method || 'GET',
    url,
    headers: new Headers(options.headers || {}),
    cookies: options.cookies || {},
    json: async () => options.body,
  }
  
  return request as any
}

/**
 * Создание mock response для тестирования
 */
export function createMockResponse() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  }
  
  return response as any
}

