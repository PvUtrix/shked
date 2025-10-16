import { http, HttpResponse } from 'msw'

/**
 * MSW handlers для мокирования API запросов в тестах
 */
export const handlers = [
  // Мок для NextAuth
  http.post('/api/auth/callback/credentials', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'student',
      },
    })
  }),

  // Мок для Telegram API
  http.post('https://api.telegram.org/bot*/sendMessage', () => {
    return HttpResponse.json({
      ok: true,
      result: {
        message_id: 123,
        chat: { id: 987654321 },
        text: 'Test message',
      },
    })
  }),

  http.post('https://api.telegram.org/bot*/editMessageText', () => {
    return HttpResponse.json({
      ok: true,
      result: {
        message_id: 123,
        chat: { id: 987654321 },
        text: 'Edited message',
      },
    })
  }),

  http.post('https://api.telegram.org/bot*/answerCallbackQuery', () => {
    return HttpResponse.json({ ok: true })
  }),

  http.post('https://api.telegram.org/bot*/setWebhook', () => {
    return HttpResponse.json({
      ok: true,
      result: true,
      description: 'Webhook was set',
    })
  }),

  http.get('https://api.telegram.org/bot*/getWebhookInfo', () => {
    return HttpResponse.json({
      ok: true,
      result: {
        url: 'https://example.com/webhook',
        has_custom_certificate: false,
        pending_update_count: 0,
      },
    })
  }),

  http.get('https://api.telegram.org/bot*/getMe', () => {
    return HttpResponse.json({
      ok: true,
      result: {
        id: 123456789,
        is_bot: true,
        first_name: 'TestBot',
        username: 'test_bot',
      },
    })
  }),
]

