import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const findByPlatformId = jest.fn<(...a: unknown[]) => Promise<unknown>>()
const linkAccount = jest.fn<(...a: unknown[]) => Promise<void>>()
const findUserByLinkToken = jest.fn<(...a: unknown[]) => Promise<string | null>>()
const consumeLinkTokens = jest.fn<(...a: unknown[]) => Promise<void>>()
const answerQuestion = jest.fn<(...a: unknown[]) => Promise<string>>()
const getScheduleForDay = jest.fn<(...a: unknown[]) => Promise<unknown[]>>()

jest.mock('@/lib/db', () => ({ prisma: { homework: { findMany: jest.fn() } } }))
jest.mock('@/lib/bot/channels', () => ({
  CHANNEL_LABEL: { telegram: 'Telegram', max: 'Max' },
  findByPlatformId: (...a: unknown[]) => findByPlatformId(...a),
  linkAccount: (...a: unknown[]) => linkAccount(...a),
}))
jest.mock('@/lib/bot/link-tokens', () => ({
  findUserByLinkToken: (...a: unknown[]) => findUserByLinkToken(...a),
  consumeLinkTokens: (...a: unknown[]) => consumeLinkTokens(...a),
}))
jest.mock('@/lib/bot/assistant', () => ({ answerQuestion: (...a: unknown[]) => answerQuestion(...a) }))
jest.mock('@/lib/bot/schedule-data', () => ({
  getScheduleForDay: (...a: unknown[]) => getScheduleForDay(...a),
  getScheduleForWeek: jest.fn(),
}))

const { handleMessage } = require('@/lib/bot/commands') as typeof import('@/lib/bot/commands')
const { botT } = require('@/lib/bot/i18n') as typeof import('@/lib/bot/i18n')

const t = botT('en')
const linked = {
  channel: 'telegram',
  platformId: '42',
  chatId: '42',
  notifications: true,
  isActive: true,
  user: { id: 'u1', firstName: 'Anna', lastName: 'K', role: 'student', groupId: 'g1', group: { name: 'TP-25' } },
}
const msg = (text: string, channel: 'telegram' | 'max' = 'telegram') => ({ channel, platformUserId: '42', chatId: '42', text })

describe('lib/bot/commands', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    findByPlatformId.mockResolvedValue(null)
  })

  it('renders texts from the message catalogue with the app name', () => {
    expect(t('link.alreadyLinked')).toBe('✅ Your account is already linked to Shked.')
    expect(botT('ru')('appName')).not.toBe('')
  })

  it('asks an unlinked user to link before showing the schedule', async () => {
    expect(await handleMessage(msg('/schedule'), t)).toBe(t('notLinked'))
    expect(getScheduleForDay).not.toHaveBeenCalled()
  })

  it('shows the channel-specific welcome on /start', async () => {
    expect(await handleMessage(msg('/start'), t)).toBe(t('start.welcomeTelegram'))
    expect(await handleMessage(msg('/start', 'max'), t)).toBe(t('start.welcomeMax'))
  })

  it('links through a /start deep-link payload and consumes the token', async () => {
    findUserByLinkToken.mockResolvedValue('web-user')
    findByPlatformId.mockResolvedValueOnce(null).mockResolvedValueOnce(linked)
    const payload = Buffer.from('tok123').toString('base64')
    const reply = await handleMessage(msg(`/start ${payload}`), t)
    expect(findUserByLinkToken).toHaveBeenCalledWith('telegram', 'tok123')
    expect(linkAccount).toHaveBeenCalledWith('telegram', 'web-user', '42', '42', undefined)
    expect(consumeLinkTokens).toHaveBeenCalledWith('telegram', 'web-user')
    expect(reply).toBe(t('start.linked', { name: 'Anna' }))
  })

  it('rejects an invalid /link token', async () => {
    findUserByLinkToken.mockResolvedValue(null)
    expect(await handleMessage(msg('/link bad'), t)).toBe(t('link.invalidToken'))
    expect(linkAccount).not.toHaveBeenCalled()
  })

  it('accepts commands addressed to the bot in a group chat', async () => {
    findByPlatformId.mockResolvedValue(linked)
    getScheduleForDay.mockResolvedValue([])
    expect(await handleMessage(msg('/schedule@shked_bot'), t)).toBe(t('schedule.noneToday'))
    expect(getScheduleForDay).toHaveBeenCalledWith('u1', 0)
  })

  it('sends free text from a linked user to the assistant', async () => {
    findByPlatformId.mockResolvedValue(linked)
    answerQuestion.mockResolvedValue('At 10:00')
    expect(await handleMessage(msg('when is my next class?'), t)).toBe('At 10:00')
    expect(answerQuestion).toHaveBeenCalledWith('u1', 'when is my next class?', t)
  })

  it('answers an unknown command with the help text', async () => {
    expect(await handleMessage(msg('/nope'), t)).toBe(t('help'))
  })
})
