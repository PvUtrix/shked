import { prisma } from '@/lib/db'
import { CHANNEL_LABEL, findByPlatformId, linkAccount, type BotChannel, type LinkedAccount, type PlatformProfile } from './channels'
import { consumeLinkTokens, findUserByLinkToken } from './link-tokens'
import { botT, formatDeadline, type BotT } from './i18n'
import { formatDay, formatWeek, statusLabel } from './format'
import { getScheduleForDay, getScheduleForWeek } from './schedule-data'
import { answerQuestion } from './assistant'

/**
 * Bot commands, shared by every messenger. A webhook route turns its
 * platform's update into an IncomingMessage and calls handleMessage.
 */

export interface IncomingMessage {
  channel: BotChannel
  platformUserId: string
  chatId: string
  text: string
  profile?: PlatformProfile
}

type Handler = (ctx: Context) => Promise<string>

interface Context {
  msg: IncomingMessage
  args: string[]
  account: LinkedAccount | null
  t: BotT
}

async function homeworkFor(account: LinkedAccount, from: Date, to?: Date) {
  if (!account.user.groupId) return []
  return prisma.homework.findMany({
    where: {
      groupId: account.user.groupId,
      isActive: true,
      deadline: { gte: from, ...(to ? { lte: to } : {}) },
    },
    include: { subject: { select: { name: true } }, submissions: { where: { userId: account.user.id } } },
    orderBy: { deadline: 'asc' },
  })
}

/** Link the sender to the web user a token was issued to. */
async function linkWithToken(ctx: Context, token: string): Promise<'linked' | 'invalid' | 'failed'> {
  const webUserId = await findUserByLinkToken(ctx.msg.channel, token)
  if (!webUserId) return 'invalid'
  try {
    await linkAccount(ctx.msg.channel, webUserId, ctx.msg.platformUserId, ctx.msg.chatId, ctx.msg.profile)
    await consumeLinkTokens(ctx.msg.channel, webUserId)
    return 'linked'
  } catch (error) {
    console.error(`Linking a ${ctx.msg.channel} account failed:`, error)
    return 'failed'
  }
}

const requireLinked =
  (handler: (ctx: Context & { account: LinkedAccount }) => Promise<string>): Handler =>
  async (ctx) =>
    ctx.account ? handler(ctx as Context & { account: LinkedAccount }) : ctx.t('notLinked')

const handlerTable: Record<string, Handler> = {
  /** /start, with an optional deep-link payload: base64 of a link token. */
  '/start': async (ctx) => {
    const { t, account } = ctx
    if (account) return t('start.alreadyLinked', { name: account.user.firstName ?? t('userFallbackName') })

    const payload = ctx.args[0]
    if (payload) {
      const token = Buffer.from(payload, 'base64').toString('utf-8')
      const result = await linkWithToken(ctx, token)
      if (result === 'invalid') return t('start.linkInvalid')
      if (result === 'failed') return t('start.linkFailed')
      const linked = await findByPlatformId(ctx.msg.channel, ctx.msg.platformUserId)
      return t('start.linked', { name: linked?.user.firstName ?? t('userFallbackName') })
    }

    return ctx.msg.channel === 'telegram' ? t('start.welcomeTelegram') : t('start.welcomeMax')
  },

  '/link': async (ctx) => {
    const { t } = ctx
    const token = ctx.args[0]
    if (!token) return t('link.usage')
    if (ctx.account) return t('link.alreadyLinked')
    const result = await linkWithToken(ctx, token)
    if (result === 'invalid') return t('link.invalidToken')
    if (result === 'failed') return t('link.failed')
    return t('link.success')
  },

  '/schedule': requireLinked(async ({ t, account }) => {
    const items = await getScheduleForDay(account.user.id, 0)
    return items.length === 0 ? t('schedule.noneToday') : formatDay(t, t('schedule.todayTitle'), items)
  }),

  '/tomorrow': requireLinked(async ({ t, account }) => {
    const items = await getScheduleForDay(account.user.id, 1)
    return items.length === 0 ? t('schedule.noneTomorrow') : formatDay(t, t('schedule.tomorrowTitle'), items)
  }),

  '/week': requireLinked(async ({ t, account }) => {
    const items = await getScheduleForWeek(account.user.id)
    return items.length === 0 ? t('schedule.noneWeek') : formatWeek(t, items)
  }),

  '/settings': requireLinked(async ({ t, account }) =>
    t('settings.text', {
      status: account.notifications ? t('settings.on') : t('settings.off'),
      platform: CHANNEL_LABEL[account.channel],
      platformId: account.platformId,
      name: [account.user.firstName, account.user.lastName].filter(Boolean).join(' '),
      group: account.user.group?.name ?? t('settings.noGroup'),
    })
  ),

  '/homework': requireLinked(async ({ t, account }) => {
    const homework = await homeworkFor(account, new Date())
    if (homework.length === 0) return t('homework.none')
    let message = `${t('homework.listTitle')}\n\n`
    homework.forEach((hw, i) => {
      const submission = hw.submissions[0]
      message += `${i + 1}. *${hw.title}*\n`
      message += `   📚 ${hw.subject.name}\n`
      message += `   ${t('homework.deadline', { deadline: formatDeadline(hw.deadline) })}\n`
      message += `   ${t('homework.status', { status: statusLabel(t, submission?.status) })}\n`
      if (submission?.grade) message += `   ${t('homework.grade', { grade: submission.grade })}\n`
      message += '\n'
    })
    return message
  }),

  '/homework_due': requireLinked(async ({ t, account }) => {
    const now = new Date()
    const homework = await homeworkFor(account, now, new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000))
    if (homework.length === 0) return t('homework.dueNone')
    let message = `${t('homework.dueTitle')}\n\n`
    homework.forEach((hw, i) => {
      const submission = hw.submissions[0]
      const hours = Math.ceil((hw.deadline.getTime() - now.getTime()) / (60 * 60 * 1000))
      message += `${i + 1}. *${hw.title}*\n`
      message += `   📚 ${hw.subject.name}\n`
      message += `   ${t('homework.hoursLeft', { hours })}\n`
      message += `   ${t('homework.status', { status: statusLabel(t, submission?.status) })}\n`
      if (submission?.grade) message += `   ${t('homework.grade', { grade: submission.grade })}\n`
      message += '\n'
    })
    return message
  }),

  '/help': async ({ t }) => t('help'),
}

// A Map, so a user-typed command can only ever select one of the handlers above.
const handlers = new Map<string, Handler>(Object.entries(handlerTable))

/** Strip a "@botname" suffix Telegram adds to commands in group chats. */
function normaliseCommand(word: string): string {
  return word.split('@')[0].toLowerCase()
}

/** Answer one incoming message. */
export async function handleMessage(msg: IncomingMessage, t: BotT = botT()): Promise<string> {
  const text = msg.text.trim()
  const account = await findByPlatformId(msg.channel, msg.platformUserId)

  if (text.startsWith('/')) {
    const [first, ...args] = text.split(/\s+/)
    const handler = handlers.get(normaliseCommand(first))
    if (handler) return handler({ msg, args, account, t })
    return t('help')
  }

  if (!account) return t('notLinked')
  return answerQuestion(account.user.id, text, t)
}
