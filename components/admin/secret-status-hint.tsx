'use client'

import { useTranslations } from 'next-intl'
import type { SecretStatus } from '@/lib/bot-secrets'

interface SecretStatusHintProps {
  status?: SecretStatus
  envName: string
}

/**
 * Says whether a secret is set and where it comes from, without showing it.
 */
export function SecretStatusHint({ status, envName }: SecretStatusHintProps) {
  const t = useTranslations('admin.secretStatus')
  if (!status) return null

  const key = !status.isSet ? 'missing' : status.source === 'env' ? 'env' : 'database'
  const tone = key === 'env' ? 'text-green-700 dark:text-green-400' : key === 'database' ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'

  return (
    <p className={`text-xs mt-1 ${tone}`} data-testid={`secret-status-${envName}`}>
      {t(key, { name: envName })}
      {status.isSet ? ` ${t('keepHint')}` : null}
    </p>
  )
}
