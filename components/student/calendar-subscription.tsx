'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

/** The personal calendar feed link, with copy and replace. */
export function CalendarSubscription() {
  const t = useTranslations('student.calendarFeed')
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/profile/calendar')
      .then((r) => (r.ok ? r.json() : { url: null }))
      .then((d) => setUrl(d.url))
      .catch(() => setUrl(null))
  }, [])

  const createOrRotate = async () => {
    setBusy(true)
    try {
      const response = await fetch('/api/profile/calendar', { method: 'POST' })
      if (!response.ok) throw new Error()
      setUrl((await response.json()).url)
    } catch {
      toast.error(t('error'))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    toast.success(t('copied'))
  }

  return (
    <Card data-testid="calendar-subscription">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {url ? (
          <>
            <div className="flex gap-2">
              <Input readOnly value={url} aria-label={t('title')} onFocus={(e) => e.currentTarget.select()} />
              <Button onClick={copy}>{t('copy')}</Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('howTo')}</p>
            <p className="text-xs text-muted-foreground">{t('private')}</p>
            <Button variant="outline" size="sm" onClick={createOrRotate} disabled={busy} title={t('rotateHint')}>
              {t('rotate')}
            </Button>
          </>
        ) : (
          <Button onClick={createOrRotate} disabled={busy}>
            {t('create')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
