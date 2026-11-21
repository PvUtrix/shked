import crypto from 'crypto'
import { prisma } from '@/lib/db'
import type { BotChannel } from './channels'

/**
 * One-time tokens a signed-in web user hands to the bot to link a messenger
 * account. Stored in verification_tokens with the identifier
 * "<channel>_link_<userId>"; valid for 15 minutes.
 */

const TOKEN_TTL_MS = 15 * 60 * 1000

const prefix = (channel: BotChannel) => `${channel}_link_`

export function generateLinkToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function saveLinkToken(channel: BotChannel, userId: string, token: string): Promise<void> {
  const identifier = `${prefix(channel)}${userId}`
  const expires = new Date(Date.now() + TOKEN_TTL_MS)
  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier, token } },
    update: { expires },
    create: { identifier, token, expires },
  })
}

/** The web user id the token was issued to, if it is valid and unexpired. */
export async function findUserByLinkToken(channel: BotChannel, token: string): Promise<string | null> {
  const row = await prisma.verificationToken.findFirst({
    where: {
      identifier: { startsWith: prefix(channel) },
      token,
      expires: { gt: new Date() },
    },
  })
  return row ? row.identifier.slice(prefix(channel).length) : null
}

/** Delete every outstanding link token of a user on this channel. */
export async function consumeLinkTokens(channel: BotChannel, userId: string): Promise<void> {
  await prisma.verificationToken.deleteMany({ where: { identifier: `${prefix(channel)}${userId}` } })
}
