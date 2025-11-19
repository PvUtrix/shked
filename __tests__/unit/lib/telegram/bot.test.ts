// Сбрасываем кеш модулей перед установкой моков для гарантии применения моков
jest.resetModules()

// Мокируем PrismaClient напрямую ПЕРЕД импортом @/lib/db
const mockBotSettingsFindFirst = jest.fn()
const mockBotSettingsCreate = jest.fn()
const mockBotSettingsUpdate = jest.fn()
const mockBotSettingsUpdateMany = jest.fn()

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    botSettings: {
      findFirst: mockBotSettingsFindFirst,
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: mockBotSettingsCreate,
      update: mockBotSettingsUpdate,
      updateMany: mockBotSettingsUpdateMany,
      delete: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    group: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subject: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    schedule: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $use: jest.fn(),
    $transaction: jest.fn(),
  }
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  }
})

// Мокируем @/lib/db для экспорта замоканного prisma
jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    botSettings: {
      findFirst: mockBotSettingsFindFirst,
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: mockBotSettingsCreate,
      update: mockBotSettingsUpdate,
      updateMany: mockBotSettingsUpdateMany,
      delete: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    group: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subject: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    schedule: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $use: jest.fn(),
    $transaction: jest.fn(),
  }
  return {
    prisma: mockPrismaClient,
  }
})

// Мокируем fetch для HTTP запросов
const mockFetch = jest.fn()

// Заменяем глобальный fetch на мок
global.fetch = mockFetch as any

import { describe, it, expect, beforeEach, beforeAll, jest } from '@jest/globals'
import crypto from 'crypto'
import { testBotSettings } from '../../../fixtures'

// Импортируем prisma из замоканного модуля
import { prisma } from '@/lib/db'

// Динамически импортируем функции после установки моков
let getBotSettings: any
let verifyWebhookSignature: any
let sendMessage: any
let editMessage: any
let answerCallbackQuery: any
let setWebhook: any
let getWebhookInfo: any
let getBotInfo: any

beforeAll(async () => {
  const botModule = await import('@/lib/telegram/bot')
  getBotSettings = botModule.getBotSettings
  verifyWebhookSignature = botModule.verifyWebhookSignature
  sendMessage = botModule.sendMessage
  editMessage = botModule.editMessage
  answerCallbackQuery = botModule.answerCallbackQuery
  setWebhook = botModule.setWebhook
  getWebhookInfo = botModule.getWebhookInfo
  getBotInfo = botModule.getBotInfo
})

describe('lib/telegram/bot.ts', () => {
  beforeEach(() => {
    // Очищаем все моки перед каждым тестом
    jest.clearAllMocks()
    
    // Устанавливаем дефолтные возвращаемые значения для fetch
    // Мокируем успешные ответы от Telegram API
    mockFetch.mockImplementation((url: string) => {
      if (typeof url !== 'string') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ok: true, result: { is_bot: true } }),
          text: async () => JSON.stringify({ ok: true, result: { is_bot: true } }),
        } as Response)
      }

      // Для getWebhookInfo
      if (url.includes('/getWebhookInfo')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            result: {
              url: 'https://example.com/webhook',
              has_custom_certificate: false,
              pending_update_count: 0,
            },
          }),
          text: async () => JSON.stringify({ ok: true }),
        } as Response)
      }

      // Для getBotInfo
      if (url.includes('/getMe')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            result: {
              id: 123456789,
              is_bot: true,
              first_name: 'TestBot',
              username: 'test_bot',
            },
          }),
          text: async () => JSON.stringify({ ok: true }),
        } as Response)
      }

      // Для всех остальных запросов (sendMessage, editMessage, answerCallbackQuery, setWebhook)
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true }),
        text: async () => JSON.stringify({ ok: true }),
      } as Response)
    })
  })

  describe('getBotSettings', () => {
    it('должен вернуть настройки бота из БД', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Используем моки
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      
      const settings = await getBotSettings()
      
      // Проверяем, что мок был вызван
      expect(mockBotSettingsFindFirst).toHaveBeenCalled()
      expect(mockBotSettingsFindFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      })
      
      expect(settings).toBeDefined()
      expect(settings).not.toBeNull()
      if (settings) {
        expect(settings.telegramBotToken).toBe(testBotSettings.default.telegramBotToken)
        expect(settings.isActive).toBe(true)
      }
    })

    it('должен вернуть null при отсутствии настроек', async () => {
      mockBotSettingsFindFirst.mockResolvedValue(null)
      const settings = await getBotSettings()
      expect(settings).toBeNull()
    })

    it('должен вернуть последние настройки при наличии нескольких записей', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        telegramBotToken: 'new-token',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const settings = await getBotSettings()
      expect(settings?.telegramBotToken).toBe('new-token')
    })
  })

  describe('verifyWebhookSignature', () => {
    it('должен корректно проверять валидную подпись', () => {
      const body = JSON.stringify({ test: 'data' })
      const secretToken = 'test-secret'

      const expectedSignature = crypto
        .createHmac('sha256', secretToken)
        .update(body)
        .digest('hex')

      const signature = `sha256=${expectedSignature}`

      const isValid = verifyWebhookSignature(body, signature, secretToken)

      expect(isValid).toBe(true)
    })

    it('должен отклонить невалидную подпись', () => {
      const body = JSON.stringify({ test: 'data' })
      const secretToken = 'test-secret'
      const signature = 'sha256=invalid-signature'

      const isValid = verifyWebhookSignature(body, signature, secretToken)

      expect(isValid).toBe(false)
    })

    it('должен отклонить подпись с неверным форматом', () => {
      const body = JSON.stringify({ test: 'data' })
      const secretToken = 'test-secret'
      const signature = 'invalid-format'

      const isValid = verifyWebhookSignature(body, signature, secretToken)

      expect(isValid).toBe(false)
    })
  })

  describe('sendMessage', () => {
    it('должен отправить сообщение при активном боте', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await sendMessage({ chat_id: 123456, text: 'Test message' })
      expect(result).toBe(true)
    })

    it('должен вернуть false при неактивном боте', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.inactive,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await sendMessage({ chat_id: 123456, text: 'Test message' })
      expect(result).toBe(false)
    })

    it('должен вернуть false при отсутствии настроек', async () => {
      mockBotSettingsFindFirst.mockResolvedValue(null)
      const result = await sendMessage({ chat_id: 123456, text: 'Test message' })
      expect(result).toBe(false)
    })

    it('должен корректно отправлять сообщение с Markdown', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await sendMessage({
        chat_id: 123456,
        text: '*Bold* and _italic_ text',
        parse_mode: 'Markdown',
      })
      expect(result).toBe(true)
    })

    it('должен корректно отправлять сообщение с inline клавиатурой', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await sendMessage({
        chat_id: 123456,
        text: 'Choose an option',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Option 1', callback_data: 'option_1' },
              { text: 'Option 2', callback_data: 'option_2' },
            ],
          ],
        },
      })
      expect(result).toBe(true)
    })
  })

  describe('editMessage', () => {
    it('должен редактировать сообщение при активном боте', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await editMessage({ chat_id: 123456, message_id: 1, text: 'Edited message' })
      expect(result).toBe(true)
    })

    it('должен вернуть false при неактивном боте', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.inactive,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await editMessage({ chat_id: 123456, message_id: 1, text: 'Edited message' })
      expect(result).toBe(false)
    })
  })

  describe('answerCallbackQuery', () => {
    it('должен ответить на callback query при активном боте', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await answerCallbackQuery({ callback_query_id: 'test-callback-id', text: 'Callback answered' })
      expect(result).toBe(true)
    })

    it('должен вернуть false при неактивном боте', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.inactive,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await answerCallbackQuery({ callback_query_id: 'test-callback-id' })
      expect(result).toBe(false)
    })
  })

  describe('setWebhook', () => {
    it('должен установить webhook URL', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      mockBotSettingsUpdateMany.mockResolvedValue({ count: 1 })

      const result = await setWebhook('https://example.com/webhook')
      expect(result).toBe(true)
      expect(mockBotSettingsUpdateMany).toHaveBeenCalledWith({
        data: { webhookUrl: 'https://example.com/webhook' }
      })
    })

    it('должен вернуть false при отсутствии токена', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        telegramBotToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const result = await setWebhook('https://example.com/webhook')
      expect(result).toBe(false)
    })
  })

  describe('getWebhookInfo', () => {
    it('должен получить информацию о webhook', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const info = await getWebhookInfo()
      expect(info).toBeDefined()
      expect(info.ok).toBe(true)
    })

    it('должен вернуть null при отсутствии токена', async () => {
      mockBotSettingsFindFirst.mockResolvedValue(null)
      const info = await getWebhookInfo()
      expect(info).toBeNull()
    })
  })

  describe('getBotInfo', () => {
    it('должен получить информацию о боте', async () => {
      const mockSettings = {
        id: 'test-id',
        ...testBotSettings.default,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockBotSettingsFindFirst.mockResolvedValue(mockSettings)
      const info = await getBotInfo()
      expect(info).toBeDefined()
      expect(info.ok).toBe(true)
      expect(info.result.is_bot).toBe(true)
    })

    it('должен вернуть null при отсутствии токена', async () => {
      mockBotSettingsFindFirst.mockResolvedValue(null)
      const info = await getBotInfo()
      expect(info).toBeNull()
    })
  })
})

