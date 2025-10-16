import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import crypto from 'crypto'
import {
  getBotSettings,
  verifyWebhookSignature,
  sendMessage,
  editMessage,
  answerCallbackQuery,
  setWebhook,
  getWebhookInfo,
  getBotInfo,
} from '@/lib/telegram/bot'
import { setupTestDb, cleanupTestDb, disconnectDb, getPrismaClient } from '../../../utils/test-helpers'
import { testBotSettings } from '../../../fixtures'
import { server } from '../../../mocks/server'

describe('lib/telegram/bot.ts', () => {
  beforeAll(() => {
    server.listen()
  })

  afterAll(async () => {
    server.close()
    await disconnectDb()
  })

  beforeEach(async () => {
    await setupTestDb()
    await cleanupTestDb()
  })

  afterEach(async () => {
    await cleanupTestDb()
    server.resetHandlers()
  })

  describe('getBotSettings', () => {
    it('должен вернуть настройки бота из БД', async () => {
      const prisma = getPrismaClient()

      // Создаем настройки бота
      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const settings = await getBotSettings()

      expect(settings).toBeDefined()
      expect(settings?.telegramBotToken).toBe(testBotSettings.default.telegramBotToken)
      expect(settings?.isActive).toBe(true)
    })

    it('должен вернуть null при отсутствии настроек', async () => {
      const settings = await getBotSettings()
      expect(settings).toBeNull()
    })

    it('должен вернуть последние настройки при наличии нескольких записей', async () => {
      const prisma = getPrismaClient()

      // Создаем несколько настроек
      await prisma.botSettings.create({
        data: { ...testBotSettings.default, telegramBotToken: 'old-token' },
      })

      // Ждем немного, чтобы createdAt был другим
      await new Promise(resolve => setTimeout(resolve, 10))

      await prisma.botSettings.create({
        data: { ...testBotSettings.default, telegramBotToken: 'new-token' },
      })

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
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const result = await sendMessage({
        chat_id: 123456,
        text: 'Test message',
      })

      expect(result).toBe(true)
    })

    it('должен вернуть false при неактивном боте', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.inactive,
      })

      const result = await sendMessage({
        chat_id: 123456,
        text: 'Test message',
      })

      expect(result).toBe(false)
    })

    it('должен вернуть false при отсутствии настроек', async () => {
      const result = await sendMessage({
        chat_id: 123456,
        text: 'Test message',
      })

      expect(result).toBe(false)
    })

    it('должен корректно отправлять сообщение с Markdown', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const result = await sendMessage({
        chat_id: 123456,
        text: '*Bold* and _italic_ text',
        parse_mode: 'Markdown',
      })

      expect(result).toBe(true)
    })

    it('должен корректно отправлять сообщение с inline клавиатурой', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

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
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const result = await editMessage({
        chat_id: 123456,
        message_id: 1,
        text: 'Edited message',
      })

      expect(result).toBe(true)
    })

    it('должен вернуть false при неактивном боте', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.inactive,
      })

      const result = await editMessage({
        chat_id: 123456,
        message_id: 1,
        text: 'Edited message',
      })

      expect(result).toBe(false)
    })
  })

  describe('answerCallbackQuery', () => {
    it('должен ответить на callback query при активном боте', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const result = await answerCallbackQuery({
        callback_query_id: 'test-callback-id',
        text: 'Callback answered',
      })

      expect(result).toBe(true)
    })

    it('должен вернуть false при неактивном боте', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.inactive,
      })

      const result = await answerCallbackQuery({
        callback_query_id: 'test-callback-id',
      })

      expect(result).toBe(false)
    })
  })

  describe('setWebhook', () => {
    it('должен установить webhook URL', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const webhookUrl = 'https://example.com/webhook'
      const result = await setWebhook(webhookUrl)

      expect(result).toBe(true)

      // Проверяем, что URL обновился в БД
      const settings = await prisma.botSettings.findFirst()
      expect(settings?.webhookUrl).toBe(webhookUrl)
    })

    it('должен вернуть false при отсутствии токена', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: { ...testBotSettings.default, telegramBotToken: null },
      })

      const result = await setWebhook('https://example.com/webhook')

      expect(result).toBe(false)
    })
  })

  describe('getWebhookInfo', () => {
    it('должен получить информацию о webhook', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const info = await getWebhookInfo()

      expect(info).toBeDefined()
      expect(info.ok).toBe(true)
    })

    it('должен вернуть null при отсутствии токена', async () => {
      const info = await getWebhookInfo()
      expect(info).toBeNull()
    })
  })

  describe('getBotInfo', () => {
    it('должен получить информацию о боте', async () => {
      const prisma = getPrismaClient()

      await prisma.botSettings.create({
        data: testBotSettings.default,
      })

      const info = await getBotInfo()

      expect(info).toBeDefined()
      expect(info.ok).toBe(true)
      expect(info.result.is_bot).toBe(true)
    })

    it('должен вернуть null при отсутствии токена', async () => {
      const info = await getBotInfo()
      expect(info).toBeNull()
    })
  })
})

