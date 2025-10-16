'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, UserPlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Student {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  subgroups: {
    subgroupCommerce: number | null
    subgroupTutorial: number | null
    subgroupFinance: number | null
    subgroupSystemThinking: number | null
  }
  userGroupId?: string
}

interface Group {
  id: string
  name: string
  description?: string
}

export default function GroupStudentsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    try {
      // Получаем информацию о группе
      const groupResponse = await fetch('/api/groups')
      if (groupResponse.ok) {
        const groupsData = await groupResponse.json()
        const currentGroup = groupsData.groups.find((g: Group) => g.id === groupId)
        setGroup(currentGroup)
      }

      // Получаем студентов группы
      const studentsResponse = await fetch(`/api/groups/${groupId}/students`)
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData.students || [])
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSubgroupChange = (studentId: string, subgroupType: string, value: string) => {
    const numericValue = value === '' ? null : parseInt(value)
    
    // Сохраняем изменения локально
    const studentChanges = changes.get(studentId) || {}
    studentChanges[subgroupType] = numericValue
    
    const newChanges = new Map(changes)
    newChanges.set(studentId, studentChanges)
    setChanges(newChanges)

    // Обновляем локальное состояние студентов
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          subgroups: {
            ...s.subgroups,
            [subgroupType]: numericValue
          }
        }
      }
      return s
    }))
  }

  const saveChanges = async () => {
    if (changes.size === 0) {
      toast.info('Нет изменений для сохранения')
      return
    }

    setSaving(true)
    try {
      const promises = []
      
      for (const [studentId, subgroups] of changes.entries()) {
        const promise = fetch(`/api/groups/${groupId}/students/${studentId}/subgroups`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subgroups),
        })
        promises.push(promise)
      }

      const results = await Promise.all(promises)
      const allSuccessful = results.every(r => r.ok)

      if (allSuccessful) {
        toast.success('Изменения сохранены')
        setChanges(new Map())
        await fetchData()
      } else {
        toast.error('Не все изменения удалось сохранить')
      }
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error)
      toast.error('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const getStudentDisplayName = (student: Student) => {
    if (student.firstName || student.lastName) {
      return `${student.lastName || ''} ${student.firstName || ''}`.trim()
    }
    return student.name || student.email
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем студентов...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Группа не найдена</p>
        <Button asChild className="mt-4">
          <Link href="/admin/groups">Вернуться к группам</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/admin/groups">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Студенты группы: {group.name}
              </h1>
              <p className="text-gray-600 mt-2">
                Управление студентами и назначение подгрупп
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => toast.info('Функция добавления студентов будет реализована в следующей версии')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Добавить студента
          </Button>
          <Button
            onClick={saveChanges}
            disabled={saving || changes.size === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Сохранение...' : `Сохранить изменения${changes.size > 0 ? ` (${changes.size})` : ''}`}
          </Button>
        </div>
      </div>

      {/* Students Table */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">В группе пока нет студентов</p>
              <p className="text-gray-400 mb-6">Добавьте студентов для начала работы</p>
              <Button onClick={() => toast.info('Функция добавления студентов будет реализована в следующей версии')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Добавить первого студента
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Список студентов ({students.length})</CardTitle>
            <CardDescription>
              Назначьте подгруппы для каждого студента по разным предметам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Студент</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Коммерция</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Семинары</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Финансы</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Сист. мышление</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{getStudentDisplayName(student)}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={student.subgroups.subgroupCommerce?.toString() || ''}
                          onValueChange={(value) => handleSubgroupChange(student.id, 'subgroupCommerce', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={student.subgroups.subgroupTutorial?.toString() || ''}
                          onValueChange={(value) => handleSubgroupChange(student.id, 'subgroupTutorial', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={student.subgroups.subgroupFinance?.toString() || ''}
                          onValueChange={(value) => handleSubgroupChange(student.id, 'subgroupFinance', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={student.subgroups.subgroupSystemThinking?.toString() || ''}
                          onValueChange={(value) => handleSubgroupChange(student.id, 'subgroupSystemThinking', value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-</SelectItem>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info('Функция удаления студентов будет реализована в следующей версии')}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {changes.size > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⚠️ У вас есть несохраненные изменения ({changes.size} студентов). Не забудьте сохранить!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>О подгруппах</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            • Подгруппы позволяют разделять студентов для разных предметов
          </p>
          <p>
            • Каждый студент может быть в разных подгруппах по разным предметам
          </p>
          <p>
            • Расписание будет автоматически фильтроваться с учетом подгрупп студента
          </p>
          <p>
            • Значение "-" означает, что студент не назначен ни в одну подгруппу по этому предмету
          </p>
          <p className="mt-4 text-blue-600">
            📖 Подробнее см. в документации: <code>docs/SUBGROUPS.md</code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

