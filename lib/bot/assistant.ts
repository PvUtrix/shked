import axios from 'axios'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { getBotSettings } from '@/lib/telegram/bot'
import { resolveSecret } from '@/lib/bot-secrets'
import { botT, formatInAppZone, type BotT } from './i18n'
import { getNextClass, getScheduleForDay, getSubgroupNames } from './schedule-data'

/**
 * Free-text questions answered by GigaChat with the user's schedule as
 * context. The key comes from GIGACHAT_API_KEY (or the deprecated stored
 * value).
 */

const GIGACHAT_OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
const GIGACHAT_CHAT_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'

export async function getGigaChatToken(): Promise<string | null> {
  const settings = await getBotSettings()
  const apiKey = settings?.openaiApiKey ?? resolveSecret('llmApiKey', null)
  if (!apiKey) return null

  try {
    const response = await axios.post(GIGACHAT_OAUTH_URL, 'scope=GIGACHAT_API_PERS', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        RqUID: crypto.randomUUID(),
        Authorization: `Bearer ${apiKey}`,
      },
    })
    return response.data.access_token ?? null
  } catch (error) {
    console.error('GigaChat token request failed:', error)
    return null
  }
}

/** The system prompt with the user's context: who they are and their classes. */
export async function buildAssistantPrompt(t: BotT, userId: string, query: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, firstName: true, lastName: true, group: { select: { name: true } } },
  })
  const [today, next, subgroups] = await Promise.all([
    getScheduleForDay(userId, 0),
    getNextClass(userId),
    getSubgroupNames(userId),
  ])

  const header = t('assistant.systemPrompt', {
    role: user?.role ?? 'student',
    name: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
    group: user?.group?.name ?? t('assistant.notSet'),
    subgroups: subgroups.length > 0 ? subgroups.join(', ') : t('assistant.notSet'),
    date: formatInAppZone(new Date(), { day: '2-digit', month: '2-digit', year: 'numeric' }),
  })

  const todayLines =
    today.length > 0
      ? today.map((s) => `- ${s.subject.name} (${s.startTime}-${s.endTime})${s.location ? `, ${s.location}` : ''}`).join('\n')
      : t('assistant.noClasses')

  const nextLine = next
    ? t('assistant.nextClass', {
        subject: next.subject.name,
        date: formatInAppZone(next.date, { day: '2-digit', month: '2-digit' }),
        time: `${next.startTime}-${next.endTime}`,
      })
    : t('assistant.noNextClass')

  return [header, `${t('assistant.todayHeader')}\n${todayLines}`, nextLine, t('assistant.question', { query })].join('\n\n')
}

export async function answerQuestion(userId: string, query: string, t: BotT = botT()): Promise<string> {
  const accessToken = await getGigaChatToken()
  if (!accessToken) return t('assistant.unavailable')

  try {
    const prompt = await buildAssistantPrompt(t, userId, query)
    const response = await axios.post(
      GIGACHAT_CHAT_URL,
      {
        model: 'GigaChat',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: query },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    )
    return response.data?.choices?.[0]?.message?.content || t('assistant.empty')
  } catch (error) {
    console.error('GigaChat request failed:', error)
    return t('assistant.error')
  }
}
