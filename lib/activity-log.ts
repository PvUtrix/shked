import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Типы действий
export type ActivityAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'SETTINGS_CHANGE'

// Типы сущностей
export type EntityType = 
  | 'User' 
  | 'Group' 
  | 'Subject' 
  | 'Schedule' 
  | 'Homework' 
  | 'Settings'
  | 'BotSettings'

// Результат операции
export type ActivityResult = 'SUCCESS' | 'FAILURE'

// Интерфейс для деталей изменения
export interface ActivityDetails {
  before?: Record<string, any>
  after?: Record<string, any>
  changes?: Array<{
    field: string
    oldValue: any
    newValue: any
  }>
  error?: string
}

// Интерфейс для параметров логирования
export interface LogActivityParams {
  userId: string
  action: ActivityAction
  entityType?: EntityType
  entityId?: string
  request: NextRequest
  details?: ActivityDetails
  result?: ActivityResult
}

/**
 * Получает IP адрес из запроса
 */
function getIpAddress(request: NextRequest): string | undefined {
  // Проверяем заголовки прокси
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Проверяем реальный IP
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Используем IP из запроса (может быть не всегда доступен)
  const ip = request.ip
  if (ip) {
    return ip
  }

  return undefined
}

/**
 * Вычисляет изменения между объектами
 */
function calculateChanges(
  before: Record<string, any> | undefined,
  after: Record<string, any> | undefined
): Array<{ field: string; oldValue: any; newValue: any }> | undefined {
  if (!before || !after) {
    return undefined
  }

  const changes: Array<{ field: string; oldValue: any; newValue: any }> = []
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])

  for (const key of allKeys) {
    const oldValue = before[key]
    const newValue = after[key]

    // Игнорируем поля, которые не должны логироваться
    if (key === 'password' || key === 'updatedAt') {
      continue
    }

    // Сравниваем значения
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue: oldValue !== undefined ? oldValue : null,
        newValue: newValue !== undefined ? newValue : null
      })
    }
  }

  return changes.length > 0 ? changes : undefined
}

/**
 * Получает реальный ID пользователя из базы данных по ID из сессии или email
 * Это необходимо, так как ID в сессии может быть устаревшим после сброса БД
 */
async function getActualUserId(userIdOrEmail: string): Promise<string | null> {
  try {
    // Сначала пытаемся найти по ID
    const userById = await prisma.user.findUnique({
      where: { id: userIdOrEmail },
      select: { id: true }
    })

    if (userById) {
      return userById.id
    }

    // Если не найден по ID, пробуем найти по email
    const userByEmail = await prisma.user.findUnique({
      where: { email: userIdOrEmail },
      select: { id: true }
    })

    if (userByEmail) {
      return userByEmail.id
    }

    return null
  } catch (error) {
    console.error('[ActivityLog] Ошибка при получении ID пользователя:', error)
    return null
  }
}

/**
 * Логирует действие пользователя
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  request,
  details,
  result = 'SUCCESS'
}: LogActivityParams): Promise<void> {
  try {
    const ipAddress = getIpAddress(request)

    // Подготавливаем детали для сохранения
    // Сохраняем только измененные значения для лучшей читаемости
    let logDetails: ActivityDetails | undefined = undefined

    if (details) {
      // Вычисляем изменения, если они не указаны явно
      const changes = details.changes || calculateChanges(details.before, details.after)

      // Для CREATE операций сохраняем только after (новые данные)
      if (action === 'CREATE' && details.after) {
        // Убираем пароли из логов
        const afterCleaned = { ...details.after }
        delete afterCleaned.password
        delete afterCleaned.updatedAt
        
        logDetails = {
          after: afterCleaned
        }
      }
      // Для UPDATE и DELETE операций сохраняем только измененные поля
      else if (changes && changes.length > 0) {
        // Фильтруем изменения, убирая пароли и другие чувствительные данные
        const filteredChanges = changes.filter(change => 
          change.field !== 'password' && 
          change.field !== 'updatedAt'
        )
        
        if (filteredChanges.length > 0) {
          logDetails = {
            changes: filteredChanges
          }
        }
      }
      // Если нет изменений, но есть только after (для CREATE без изменений)
      else if (details.after) {
        const afterCleaned = { ...details.after }
        delete afterCleaned.password
        delete afterCleaned.updatedAt
        
        logDetails = {
          after: afterCleaned
        }
      }
      // Если есть только error
      else if (details.error) {
        logDetails = {
          error: details.error
        }
      }
    }

    // Получаем реальный ID пользователя из базы данных
    // Это необходимо, так как ID в сессии может быть устаревшим после сброса БД
    const actualUserId = await getActualUserId(userId)

    if (!actualUserId) {
      console.warn(`[ActivityLog] Пользователь с ID/email ${userId} не найден в базе данных, пропускаем логирование`)
      return
    }

    // Сохраняем лог в базу данных с реальным ID пользователя
    await prisma.activityLog.create({
      data: {
        userId: actualUserId,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        ipAddress: ipAddress || null,
        details: logDetails ? (logDetails as any) : null,
        result
      }
    })
  } catch (error) {
    // Логируем ошибку, но не прерываем выполнение основной операции
    console.error('Ошибка при логировании активности:', error)
  }
}

