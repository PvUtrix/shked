import { prisma } from '@/lib/db'
import { sendMessage as sendTelegramMessage } from '@/lib/telegram/bot'
import { sendMessage as sendMaxMessage } from '@/lib/max/bot'

/**
 * The one place that knows how each messenger stores linked accounts and
 * delivers a message. Everything else in lib/bot is channel-agnostic.
 */

export type BotChannel = 'telegram' | 'max'
export const BOT_CHANNELS: BotChannel[] = ['telegram', 'max']
export const CHANNEL_LABEL: Record<BotChannel, string> = { telegram: 'Telegram', max: 'Max' }

export interface LinkedAccount {
  channel: BotChannel
  platformId: string
  chatId: string
  notifications: boolean
  isActive: boolean
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    role: string
    groupId: string | null
    group: { name: string } | null
  }
}

export interface PlatformProfile {
  username?: string
  firstName?: string
  lastName?: string
}

const userInclude = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      groupId: true,
      group: { select: { name: true } },
    },
  },
} as const

type Row = {
  chatId: string
  notifications: boolean
  isActive: boolean
  user: LinkedAccount['user']
}

function toAccount(channel: BotChannel, platformId: string, row: Row): LinkedAccount {
  return {
    channel,
    platformId,
    chatId: row.chatId,
    notifications: row.notifications,
    isActive: row.isActive,
    user: row.user,
  }
}

/** The account linked to a messenger user id, if any. */
export async function findByPlatformId(channel: BotChannel, platformId: string): Promise<LinkedAccount | null> {
  if (channel === 'telegram') {
    const row = await prisma.telegramUser.findUnique({ where: { telegramId: platformId }, include: userInclude })
    return row ? toAccount(channel, row.telegramId, row) : null
  }
  const row = await prisma.maxUser.findUnique({ where: { maxId: platformId }, include: userInclude })
  return row ? toAccount(channel, row.maxId, row) : null
}

/** The account a web user linked on this messenger, if any. */
export async function findByUserId(channel: BotChannel, userId: string): Promise<LinkedAccount | null> {
  if (channel === 'telegram') {
    const row = await prisma.telegramUser.findUnique({ where: { userId }, include: userInclude })
    return row ? toAccount(channel, row.telegramId, row) : null
  }
  const row = await prisma.maxUser.findUnique({ where: { userId }, include: userInclude })
  return row ? toAccount(channel, row.maxId, row) : null
}

/** Link a messenger account to a web user (or move an existing link). */
export async function linkAccount(
  channel: BotChannel,
  userId: string,
  platformId: string,
  chatId: string,
  profile: PlatformProfile = {}
): Promise<void> {
  const data = { chatId, ...profile, isActive: true, notifications: true }
  if (channel === 'telegram') {
    await prisma.telegramUser.upsert({
      where: { userId },
      update: { telegramId: platformId, ...data },
      create: { userId, telegramId: platformId, ...data },
    })
    return
  }
  await prisma.maxUser.upsert({
    where: { userId },
    update: { maxId: platformId, ...data },
    create: { userId, maxId: platformId, ...data },
  })
}

/**
 * Refresh the chat id and profile of an already linked account. Messages from
 * people who have not linked an account are not stored.
 */
export async function refreshProfile(
  channel: BotChannel,
  platformId: string,
  chatId: string,
  profile: PlatformProfile
): Promise<void> {
  const data = { chatId, ...profile, isActive: true }
  if (channel === 'telegram') {
    await prisma.telegramUser.updateMany({ where: { telegramId: platformId }, data })
    return
  }
  await prisma.maxUser.updateMany({ where: { maxId: platformId }, data })
}

export interface RecipientFilter {
  groupId?: string
  role?: string
  userIds?: string[]
}

/** Active accounts with notifications on, optionally narrowed. */
export async function listRecipients(channel: BotChannel, filter: RecipientFilter = {}): Promise<LinkedAccount[]> {
  const userWhere = {
    ...(filter.groupId ? { groupId: filter.groupId } : {}),
    ...(filter.role ? { role: filter.role } : {}),
  }
  const where = {
    isActive: true,
    notifications: true,
    ...(Object.keys(userWhere).length > 0 ? { user: userWhere } : {}),
    ...(filter.userIds ? { userId: { in: filter.userIds } } : {}),
  }
  if (channel === 'telegram') {
    const rows = await prisma.telegramUser.findMany({ where, include: userInclude })
    return rows.map((r) => toAccount(channel, r.telegramId, r))
  }
  const rows = await prisma.maxUser.findMany({ where, include: userInclude })
  return rows.map((r) => toAccount(channel, r.maxId, r))
}

export interface ChannelStats {
  totalUsers: number
  activeUsers: number
  notificationsEnabled: number
  recentActivity: number
}

export async function channelStats(channel: BotChannel): Promise<ChannelStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const delegate = channel === 'telegram' ? prisma.telegramUser : prisma.maxUser
  // Both delegates share the count signature used here.
  const count = (args?: { where: Record<string, unknown> }) =>
    (delegate.count as (a?: { where: Record<string, unknown> }) => Promise<number>)(args)
  const [totalUsers, activeUsers, notificationsEnabled, recentActivity] = await Promise.all([
    count(),
    count({ where: { isActive: true } }),
    count({ where: { notifications: true } }),
    count({ where: { createdAt: { gte: weekAgo } } }),
  ])
  return { totalUsers, activeUsers, notificationsEnabled, recentActivity }
}

/** Deliver Markdown text to a chat. Returns false when nothing was sent. */
export async function sendText(channel: BotChannel, chatId: string, text: string): Promise<boolean> {
  if (channel === 'telegram') {
    const id = Number(chatId)
    if (!Number.isFinite(id)) return false
    return sendTelegramMessage({ chat_id: id, text, parse_mode: 'Markdown' })
  }
  return sendMaxMessage({ chat_id: chatId, text, parse_mode: 'Markdown' })
}

/**
 * Deliver to every messenger a web user has linked, with notifications on.
 * Returns how many channels accepted the message.
 */
export async function sendToUser(userId: string, render: (account: LinkedAccount) => string): Promise<number> {
  let delivered = 0
  for (const channel of BOT_CHANNELS) {
    const account = await findByUserId(channel, userId)
    if (!account || !account.isActive || !account.notifications) continue
    if (await sendText(channel, account.chatId, render(account))) delivered++
  }
  return delivered
}
