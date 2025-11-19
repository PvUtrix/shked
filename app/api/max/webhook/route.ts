import { NextRequest, NextResponse } from 'next/server'
import { MaxUpdate } from '@/lib/max/bot'
import { routeCommand } from '@/lib/max/commands'
import { sendMessage } from '@/lib/max/bot'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const update: MaxUpdate = JSON.parse(body)

    console.error('Received Max update:', JSON.stringify(update, null, 2))

    // Handle regular messages
    if (update.message) {
      const { from, chat, text } = update.message

      if (!text) {
        return NextResponse.json({ ok: true })
      }

      // Update user info in DB
      await updateUserInfo(from.id.toString(), chat.id.toString(), from)

      // Handle commands
      let response: string

      if (text.startsWith('/')) {
        const [_command, ...args] = text.split(' ')
        response = await routeCommand(from.id.toString(), chat.id, text, args)
      } else {
        // Handle natural language
        const [_command, ...args] = text.split(' ')
        response = await routeCommand(from.id.toString(), chat.id, text, args)
      }

      // Send response
      await sendMessage({
        chat_id: chat.id,
        text: response,
        parse_mode: 'Markdown'
      })
    }

    // Handle callback queries (buttons)
    if (update.callback_query) {
      const { id: _id, from, data } = update.callback_query

      // Update user info
      await updateUserInfo(from.id.toString(), from.id.toString(), from)

      // Note: Max may handle callbacks differently
      // This needs to be updated based on actual Max API

      // Handle callback data
      if (data) {
        console.error('Callback data:', data)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in Max webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Update user info in DB
 */
async function updateUserInfo(
  maxId: string,
  chatId: string,
  from: {
    id: string
    first_name: string
    last_name?: string
    username?: string
  }
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.maxUser.findUnique({
      where: { maxId }
    })

    if (existingUser) {
      // Update existing user
      await prisma.maxUser.update({
        where: { maxId },
        data: {
          chatId,
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
          isActive: true
        }
      })
    } else {
      // Create new user (without web account link)
      await prisma.maxUser.create({
        data: {
          maxId,
          chatId,
          username: from.username,
          firstName: from.first_name,
          lastName: from.last_name,
          isActive: true,
          notifications: true,
          userId: 'temp_' + maxId // temporary ID until linked
        }
      })
    }
  } catch (error) {
    console.error('Error updating Max user info:', error)
  }
}
