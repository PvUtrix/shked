'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

/** Key of a subgroup set: the subject id, or "_group" for group-wide subgroups. */
type SetKey = string
const GROUP_WIDE: SetKey = '_group'

interface Student {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  subgroups: Record<SetKey, string>
}

interface Subgroup {
  id: string
  name: string
  number: number
  subjectId: string | null
  subject: { id: string; name: string } | null
}

interface Group {
  id: string
  name: string
}

interface SubgroupSet {
  key: SetKey
  label: string
  subgroups: Subgroup[]
}

export default function GroupStudentsPage() {
  const t = useTranslations('admin.groupStudents')
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [subgroups, setSubgroups] = useState<Subgroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // studentId -> set key -> subgroup id (null removes the membership)
  const [changes, setChanges] = useState<Map<string, Record<SetKey, string | null>>>(new Map())

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, studentsRes, subgroupsRes] = await Promise.all([
        fetch('/api/groups'),
        fetch(`/api/groups/${groupId}/students`),
        fetch(`/api/groups/${groupId}/subgroups`),
      ])
      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroup((data.groups as Group[]).find((g) => g.id === groupId) ?? null)
      }
      if (studentsRes.ok) setStudents((await studentsRes.json()).students ?? [])
      if (subgroupsRes.ok) setSubgroups(await subgroupsRes.json())
    } catch (error) {
      console.error('Loading group students failed:', error)
      toast.error(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [groupId, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /** One column per subject that has subgroups in this group. */
  const sets = useMemo<SubgroupSet[]>(() => {
    const byKey = new Map<SetKey, SubgroupSet>()
    for (const sg of subgroups) {
      const key = sg.subjectId ?? GROUP_WIDE
      if (!byKey.has(key)) byKey.set(key, { key, label: sg.subject?.name ?? t('groupWide'), subgroups: [] })
      byKey.get(key)!.subgroups.push(sg)
    }
    return [...byKey.values()]
      .map((set) => ({ ...set, subgroups: [...set.subgroups].sort((a, b) => a.number - b.number) }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [subgroups, t])

  const handleChange = (studentId: string, key: SetKey, value: string) => {
    const subgroupId = value === 'none' ? null : value
    setChanges((prev) => {
      const next = new Map(prev)
      next.set(studentId, { ...(next.get(studentId) ?? {}), [key]: subgroupId })
      return next
    })
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s
        const updated = { ...s.subgroups }
        if (subgroupId) updated[key] = subgroupId
        else delete updated[key]
        return { ...s, subgroups: updated }
      })
    )
  }

  const saveChanges = async () => {
    if (changes.size === 0) {
      toast.info(t('noChanges'))
      return
    }
    setSaving(true)
    try {
      const results = await Promise.all(
        [...changes.entries()].map(([studentId, assignments]) =>
          fetch(`/api/groups/${groupId}/students/${studentId}/subgroups`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignments }),
          })
        )
      )
      if (results.every((r) => r.ok)) {
        toast.success(t('saved'))
        setChanges(new Map())
        await fetchData()
      } else {
        toast.error(t('saveFailed'))
      }
    } catch (error) {
      console.error('Saving subgroup assignments failed:', error)
      toast.error(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const displayName = (s: Student) =>
    s.firstName || s.lastName ? `${s.lastName ?? ''} ${s.firstName ?? ''}`.trim() : s.name || s.email

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('groupNotFound')}</p>
        <Button asChild className="mt-4">
          <Link href="/admin/groups">{t('backToGroups')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/groups">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('title', { group: group.name })}</h1>
            <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/subgroups">{t('manageSubgroups')}</Link>
          </Button>
          <Button onClick={saveChanges} disabled={saving || changes.size === 0}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? t('saving') : changes.size > 0 ? t('saveCount', { count: changes.size }) : t('save')}
          </Button>
        </div>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">{t('empty')}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('listTitle', { count: students.length })}</CardTitle>
            <CardDescription>{sets.length > 0 ? t('listDescription') : t('noSubgroups')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">{t('student')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">{t('email')}</th>
                    {sets.map((set) => (
                      <th key={set.key} className="text-center py-3 px-4 font-semibold text-sm">
                        {set.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{displayName(student)}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{student.email}</td>
                      {sets.map((set) => (
                        <td key={set.key} className="py-3 px-4">
                          <Select
                            value={student.subgroups[set.key] ?? 'none'}
                            onValueChange={(value) => handleChange(student.id, set.key, value)}
                          >
                            <SelectTrigger className="w-40" aria-label={`${displayName(student)}: ${set.label}`}>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              {set.subgroups.map((sg) => (
                                <SelectItem key={sg.id} value={sg.id}>
                                  {sg.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {changes.size > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                {t('unsaved', { count: changes.size })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('aboutTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• {t('about1')}</p>
          <p>• {t('about2')}</p>
          <p>• {t('about3')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
