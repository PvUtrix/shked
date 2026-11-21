'use client'

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Deadline {
  id: string
  title: string
  details: string | null
  subject: string | null
  dueAt: string
  allDay: boolean
  submissionChannel: string | null
  submissionTarget: string | null
  namingRule: string | null
  links: Array<{ url: string }>
  source: string
}

interface Announcement {
  id: string
  kind: string
  title: string
  subject: string | null
  details: { before?: Record<string, string>; after?: Record<string, string> } | null
  source: string
  createdAt: string
}

const TIME_ZONE = 'Europe/Moscow'

export default function StudentDeadlinesPage() {
  const t = useTranslations('student.deadlines')
  const tk = useTranslations('admin.timetable.kind')
  const locale = useLocale()
  const [data, setData] = useState<{ deadlines: Deadline[]; announcements: Announcement[] } | null>(null)

  useEffect(() => {
    fetch('/api/deadlines')
      .then((r) => (r.ok ? r.json() : { deadlines: [], announcements: [] }))
      .then(setData)
      .catch(() => setData({ deadlines: [], announcements: [] }))
  }, [])

  const formatDue = (d: Deadline) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: TIME_ZONE,
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      ...(d.allDay ? {} : { hour: '2-digit', minute: '2-digit' }),
    }).format(new Date(d.dueAt))

  const when = (x?: Record<string, string>) => (x ? [x.date ?? x.due?.slice(0, 10), x.start && `${x.start}-${x.end}`].filter(Boolean).join(' ') : '')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {data && data.deadlines.length === 0 && <p className="text-muted-foreground">{t('empty')}</p>}

      <div className="space-y-3">
        {data?.deadlines.map((d) => (
          <Card key={d.id} data-testid="deadline">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{d.subject ? `${d.subject}: ${d.title}` : d.title}</CardTitle>
              <CardDescription>
                {t('due', { date: formatDue(d) })} · {t(`source.${d.source}`)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {d.details && d.details !== d.title && <p className="whitespace-pre-line">{d.details}</p>}
              {d.submissionTarget && (
                <p>
                  <span className="font-medium">{t('submit')}:</span>{' '}
                  {d.submissionChannel ? `${t(`channel.${d.submissionChannel}`)} — ` : ''}
                  {/^https?:\/\//.test(d.submissionTarget) ? (
                    <a href={d.submissionTarget} target="_blank" rel="noopener noreferrer" className="underline break-all">
                      {d.submissionTarget}
                    </a>
                  ) : (
                    d.submissionTarget
                  )}
                </p>
              )}
              {d.namingRule && (
                <p>
                  <span className="font-medium">{t('naming')}:</span> {d.namingRule}
                </p>
              )}
              {d.links.length > 1 && (
                <div>
                  <span className="font-medium">{t('links')}:</span>
                  <ul className="list-disc pl-5">
                    {d.links.map((l) => (
                      <li key={l.url}>
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline break-all">
                          {l.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('changesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {data && data.announcements.length === 0 && <p className="text-muted-foreground">{t('noChanges')}</p>}
          {data?.announcements.map((a) => (
            <p key={a.id}>
              <span className="font-medium">{tk(a.kind)}</span>: {a.subject ? `${a.subject}, ` : ''}
              {a.title} {a.details?.before && a.details?.after ? `${when(a.details.before)} → ${when(a.details.after)}` : when(a.details?.after ?? a.details?.before)}
              <span className="text-muted-foreground"> · {t(`source.${a.source}`)}</span>
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
