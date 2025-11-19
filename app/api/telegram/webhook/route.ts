import { NextRequest, NextResponse } from 'next/server'
import { TelegramUpdate } from '@/lib/telegram/bot'
import { routeCommand } from '@/lib/telegram/commands'
import { sendMessage, answerCallbackQuery } from '@/lib/telegram/bot'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const update: TelegramUpdate = JSON.parse(body)

    console.error('Received Telegram update:', JSON.stringify(update, null, 2))

    // Обработка обычных сообщений
    if (update.message) {
      const { from, chat, text } = update.message
      
      if (!text) {
        return NextResponse.json({ ok: true })
      }

      // Обновляем информацию о пользователе в БД
      await updateUserInfo(from.id.toString(), chat.id.toString(), from)

      // Обработка команд
      let response: string

      if (text.startsWith('/')) {
        const [command, ...args] = text.split(' ')
        response = await routeCommand(from.id.toString(), chat.id, command, args)
      } else {
        // Обработка естественного языка
        const [command, ...args] = text.split(' ')
        response = await routeCommand(from.id.toString(), chat.id, text, args)
      }

      // Отправляем ответ
      await sendMessage({
        chat_id: chat.id,
        text: response,
        parse_mode: 'Markdown'
      })
    }

    // Обработка callback queries (кнопки)
    if (update.callback_query) {
      const { id, from, data } = update.callback_query
      
      // Обновляем информацию о пользователе
      await updateUserInfo(from.id.toString(), from.id.toString(), from)

      // Отвечаем на callback query
      await answerCallbackQuery({
        callback_query_id: id,
        text: 'Обработано'
      })

      // Здесь можно добавить обработку различных callback data
      if (data) {
        // Обработка callback data
        console.error('Callback data:', data)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Ошибка в webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Обновить информацию о пользователе в БД
 */
async function updateUserInfo(
  telegramId: string,
  chatId: string,
  from: {
    id: number
    is_bot: boolean
    first_name: string
    last_name?: string
    username?: string
  }
) {
  try {
    // Проверяем, есть ли уже такой пользователь
    const existingUser = await prisma.telegramUser.findUnique({
      where: { telegramId }
    })

    if (existingUser) {
      // Обновляем существующего пользователя
      await prisma.telegramUser.update({
        where: { telegramId },
        data: {
          chatId,
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
          isActive: true
        }
      })
    } else {
      // Создаем нового пользователя (но без привязки к веб-аккаунту)
      await prisma.telegramUser.create({
        data: {
          telegramId,
          chatId,
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
          isActive: true,
          notifications: true,
          userId: 'temp_' + telegramId // временный ID до привязки
        }
      })
    }
  } catch (error) {
    console.error('Ошибка при обновлении информации о пользователе:', error)
  }
}
