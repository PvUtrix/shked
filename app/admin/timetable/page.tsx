'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface Guess {
  sourceRef: string
  sheets: string[]
  timetable: string | null
  deadlines: string | null
  placement: string | null
  eventCounts: Record<string, number>
}

interface Counts {
  added: number
  changed: number
  removed: number
  unchanged: number
}

interface Change {
  kind: string
  title: string
  subject: string
  subgroup?: string
  before?: Record<string, string>
  after?: Record<string, string>
}

interface Summary {
  dryRun: boolean
  firstImport: boolean
  subjects: { created: string[] }
  subgroups: { created: string[] }
  schedules: Counts
  deadlines: Counts
  placements: { students: number; matched: number; unmatched: string[]; membershipsChanged: number }
  changes: Change[]
  warnings: string[]
}

const NONE = ''
const SHOWN_CHANGES = 60

export default function TimetableImportPage() {
  const t = useTranslations('admin.timetable')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [guess, setGuess] = useState<Guess | null>(null)
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [groupId, setGroupId] = useState('')
  const [semesterNumber, setSemesterNumber] = useState('1')
  const [semesterTitle, setSemesterTitle] = useState('')
  const [sheets, setSheets] = useState({ timetable: NONE, deadlines: NONE, placement: NONE })
  const [summary, setSummary] = useState<Summary | null>(null)
  const [busy, setBusy] = useState<'read' | 'preview' | 'apply' | null>(null)

  useEffect(() => {
    fetch('/api/groups')
      .then((r) => (r.ok ? r.json() : { groups: [] }))
      .then((d) => {
        setGroups(d.groups ?? [])
        if (d.groups?.length === 1) setGroupId(d.groups[0].id)
      })
      .catch(() => setGroups([]))
  }, [])

  const send = async (mode: 'inspect' | 'preview' | 'apply') => {
    const form = new FormData()
    form.set('mode', mode)
    if (file) form.set('file', file)
    else form.set('url', url)
    form.set('groupId', groupId)
    form.set('semesterNumber', semesterNumber)
    form.set('semesterTitle', semesterTitle)
    form.set('timetableSheet', sheets.timetable)
    form.set('deadlinesSheet', sheets.deadlines)
    form.set('placementSheet', sheets.placement)
    const response = await fetch('/api/admin/timetable/import', { method: 'POST', body: form })
    const body = await response.json()
    if (!response.ok) throw new Error(body.error || t('error'))
    return body
  }

  const read = async () => {
    setBusy('read')
    setSummary(null)
    try {
      const g: Guess = await send('inspect')
      setGuess(g)
      setSheets({ timetable: g.timetable ?? NONE, deadlines: g.deadlines ?? NONE, placement: g.placement ?? NONE })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error'))
    } finally {
      setBusy(null)
    }
  }

  const run = async (mode: 'preview' | 'apply') => {
    setBusy(mode)
    try {
      const { summary: s } = await send(mode)
      setSummary(s)
      if (mode === 'apply') toast.success(t('applied'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('error'))
    } finally {
      setBusy(null)
    }
  }

  const sheetSelect = (key: keyof typeof sheets, label: string, optional: boolean) => (
    <div className="space-y-1">
      <Label htmlFor={`sheet-${key}`}>{label}</Label>
      <select
        id={`sheet-${key}`}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={sheets[key]}
        onChange={(e) => setSheets((s) => ({ ...s, [key]: e.target.value }))}
      >
        {optional && <option value={NONE}>{t('notUsed')}</option>}
        {guess?.sheets.map((name) => (
          <option key={name} value={name}>
            {name}
            {key === 'timetable' && guess.eventCounts[name] ? ` (${t('events', { count: guess.eventCounts[name] })})` : ''}
          </option>
        ))}
      </select>
    </div>
  )

  const counts = (c: Counts) =>
    [t('added', { count: c.added }), t('changed', { count: c.changed }), t('removed', { count: c.removed }), t('unchanged', { count: c.unchanged })].join(' · ')

  const describe = (c: Change) => {
    const when = (x?: Record<string, string>) => (x ? [x.date ?? x.due, x.start && `${x.start}-${x.end}`].filter(Boolean).join(' ') : '')
    const arrow = c.before && c.after ? `${when(c.before)} → ${when(c.after)}` : when(c.after ?? c.before)
    return `${c.subject}${c.subgroup ? ` (${c.subgroup})` : ''}: ${c.title} ${arrow}`
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('sourceTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="timetable-file">{t('file')}</Label>
            <Input id="timetable-file" type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="timetable-url">{t('url')}</Label>
            <Input id="timetable-url" type="url" placeholder="https://docs.google.com/spreadsheets/d/..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={!!file} />
            <p className="text-xs text-muted-foreground">{t('urlHint')}</p>
          </div>
          <Button onClick={read} disabled={busy !== null || (!file && !url)}>
            {busy === 'read' ? t('reading') : t('read')}
          </Button>
        </CardContent>
      </Card>

      {guess && (
        <Card>
          <CardHeader>
            <CardTitle>{t('setupTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="import-group">{t('group')}</Label>
              <select
                id="import-group"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
                <option value="" />
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="semester-number">{t('semesterNumber')}</Label>
                <Input id="semester-number" type="number" min={1} value={semesterNumber} onChange={(e) => setSemesterNumber(e.target.value)} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="semester-title">{t('semesterTitle')}</Label>
                <Input id="semester-title" value={semesterTitle} onChange={(e) => setSemesterTitle(e.target.value)} />
              </div>
            </div>
            {sheetSelect('timetable', t('timetableSheet'), false)}
            {sheetSelect('deadlines', t('deadlinesSheet'), true)}
            {sheetSelect('placement', t('placementSheet'), true)}
            <div className="flex items-end">
              <Button onClick={() => run('preview')} disabled={busy !== null || !groupId || !sheets.timetable}>
                {busy === 'preview' ? t('previewing') : t('preview')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>{t('resultTitle')}</CardTitle>
            {summary.firstImport && <CardDescription>{t('firstImport')}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>{t('schedules')}:</strong> {counts(summary.schedules)}
            </p>
            <p>
              <strong>{t('deadlines')}:</strong> {counts(summary.deadlines)}
            </p>
            {summary.subjects.created.length > 0 && <p>{t('subjectsCreated', { list: summary.subjects.created.join('; ') })}</p>}
            {summary.subgroups.created.length > 0 && <p>{t('subgroupsCreated', { list: summary.subgroups.created.join('; ') })}</p>}
            {summary.placements.students > 0 && (
              <p>
                {t('placements', {
                  matched: summary.placements.matched,
                  students: summary.placements.students,
                  changed: summary.placements.membershipsChanged,
                })}
              </p>
            )}
            {summary.placements.unmatched.length > 0 && (
              <p className="text-amber-700 dark:text-amber-400">{t('unmatched', { list: summary.placements.unmatched.join(', ') })}</p>
            )}
            {summary.warnings.length > 0 && (
              <div>
                <p className="font-semibold">{t('warnings')}</p>
                <ul className="list-disc pl-5 text-amber-700 dark:text-amber-400">
                  {summary.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {!summary.firstImport && summary.changes.length > 0 && (
              <div>
                <p className="font-semibold">{t('changes')}</p>
                <ul className="space-y-1">
                  {summary.changes.slice(0, SHOWN_CHANGES).map((c, i) => (
                    <li key={i}>
                      <span className="font-medium">{t(`kind.${c.kind}`)}</span>: {describe(c)}
                    </li>
                  ))}
                </ul>
                {summary.changes.length > SHOWN_CHANGES && <p className="text-muted-foreground">{t('more', { count: summary.changes.length - SHOWN_CHANGES })}</p>}
              </div>
            )}
            {summary.dryRun && (
              <Button onClick={() => run('apply')} disabled={busy !== null}>
                {busy === 'apply' ? t('applying') : t('apply')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
