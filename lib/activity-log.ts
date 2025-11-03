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
    let logDetails: ActivityDetails | undefined = undefined

    if (details) {
      logDetails = {
        ...details,
        // Вычисляем изменения, если они не указаны явно
        changes: details.changes || calculateChanges(details.before, details.after)
      }

      // Убираем пароли из логов
      if (logDetails.before && 'password' in logDetails.before) {
        logDetails.before = { ...logDetails.before }
        delete logDetails.before.password
      }
      if (logDetails.after && 'password' in logDetails.after) {
        logDetails.after = { ...logDetails.after }
        delete logDetails.after.password
      }
    }

    // Сохраняем лог в базу данных
    await prisma.activityLog.create({
      data: {
        userId,
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

