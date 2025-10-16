
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, UserPlus, Edit, Trash2, UserCheck } from 'lucide-react'
import { GroupForm } from '@/components/admin/group-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  description?: string
  semester?: string
  year?: string
  _count?: {
    users: number
    schedules: number
    homework: number
  }
}

interface Mentor {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  mentorGroupIds?: string[]
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [groupFormOpen, setGroupFormOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Получаем группы
      const groupsResponse = await fetch('/api/groups')
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setGroups(groupsData.groups || [])
      }

      // Получаем менторов
      const mentorsResponse = await fetch('/api/users?role=mentor')
      if (mentorsResponse.ok) {
        const mentorsData = await mentorsResponse.json()
        setMentors(mentorsData.users || [])
      }
    } catch (error) {
      console.error('Ошибка при получении данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const assignMentor = async (groupId: string, mentorId: string) => {
    try {
      // Получаем текущего ментора группы
      const currentMentor = mentors.find(mentor => 
        Array.isArray(mentor.mentorGroupIds) && mentor.mentorGroupIds.includes(groupId)
      )

      // Обновляем mentorGroupIds для старого ментора
      if (currentMentor) {
        const updatedGroupIds = Array.isArray(currentMentor.mentorGroupIds) 
          ? currentMentor.mentorGroupIds.filter(id => id !== groupId)
          : []
        
        await fetch('/api/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: currentMentor.id,
            mentorGroupIds: updatedGroupIds
          }),
        })
      }

      // Обновляем mentorGroupIds для нового ментора (только если не "none")
      if (mentorId && mentorId !== 'none') {
        const newMentor = mentors.find(mentor => mentor.id === mentorId)
        if (newMentor) {
          const updatedGroupIds = Array.isArray(newMentor.mentorGroupIds) 
            ? [...newMentor.mentorGroupIds, groupId]
            : [groupId]
          
          await fetch('/api/users', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: newMentor.id,
              mentorGroupIds: updatedGroupIds
            }),
          })
        }
      }

      await fetchData() // Обновляем данные
    } catch (error) {
      console.error('Ошибка при назначении ментора:', error)
      alert('Произошла ошибка при назначении ментора')
    }
  }

  const handleCreateGroup = () => {
    setEditingGroup(null)
    setGroupFormOpen(true)
  }

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group)
    setGroupFormOpen(true)
  }

  const handleDeleteGroup = (group: Group) => {
    setGroupToDelete(group)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return

    try {
      const response = await fetch(`/api/groups?id=${groupToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Группа удалена')
        await fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при удалении группы')
      }
    } catch (error) {
      console.error('Ошибка при удалении группы:', error)
      toast.error('Произошла ошибка при удалении')
    } finally {
      setDeleteDialogOpen(false)
      setGroupToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Управление группами
          </h1>
          <p className="text-gray-600 mt-2">
            Создавайте и управляйте учебными группами студентов
          </p>
        </div>
        <Button onClick={handleCreateGroup}>
          <UserPlus className="h-4 w-4 mr-2" />
          Создать группу
        </Button>
      </div>

      {/* Groups List */}
      <div className="grid gap-6">
        {groups?.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Групп не найдено</p>
                <p className="text-gray-400 mb-6">Создайте первую группу для начала работы</p>
                <Button onClick={handleCreateGroup}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Создать первую группу
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups?.map((group, index) => (
              <Card key={group?.id || index} className="card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {group?.name || 'Группа без названия'}
                    </CardTitle>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditGroup(group)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {group?.description || 'Описание не указано'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Студентов:</span>
                        <span className="font-medium">{group?._count?.users || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Занятий:</span>
                        <span className="font-medium">{group?._count?.schedules || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Заданий:</span>
                        <span className="font-medium">{group?._count?.homework || 0}</span>
                      </div>
                      {group?.semester && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Семестр:</span>
                          <span className="font-medium">{group.semester}</span>
                        </div>
                      )}
                      {group?.year && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Год:</span>
                          <span className="font-medium">{group.year}</span>
                        </div>
                      )}
                    </div>

                    {/* Назначение ментора */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Ментор:</span>
                      </div>
                      <Select
                        value={mentors.find(mentor => 
                          Array.isArray(mentor.mentorGroupIds) && mentor.mentorGroupIds.includes(group.id)
                        )?.id || ''}
                        onValueChange={(value) => assignMentor(group.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите ментора" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без ментора</SelectItem>
                          {mentors.map(mentor => (
                            <SelectItem key={mentor.id} value={mentor.id}>
                              {mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || mentor.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        asChild
                      >
                        <a href={`/admin/groups/${group.id}/students`}>
                          <Users className="h-4 w-4 mr-2" />
                          Управлять студентами
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || []}
          </div>
        )}
      </div>

      {/* Форма группы */}
      <GroupForm
        open={groupFormOpen}
        onOpenChange={setGroupFormOpen}
        group={editingGroup}
        onSuccess={handleFormSuccess}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Удалить группу"
        description={`Вы уверены, что хотите удалить группу "${groupToDelete?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmDeleteGroup}
        variant="destructive"
      />
    </div>
  )
}
