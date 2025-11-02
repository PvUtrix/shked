'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Search, Users, UserCheck, GraduationCap, BookOpen, UserCog, Plus, Edit, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { UserForm } from '@/components/admin/user-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface User {
  id: string
  name: string | null
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  groupId: string | null
  createdAt: string
  isActive?: boolean
  group?: {
    id: string
    name: string
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [userToRestore, setUserToRestore] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [showInactive])

  const fetchUsers = async () => {
    try {
      const url = showInactive ? '/api/users?includeInactive=true' : '/api/users'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        toast.error('Ошибка при загрузке пользователей')
      }
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error)
      toast.error('Ошибка при загрузке пользователей')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Обновляем локальное состояние
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        )
        toast.success('Роль пользователя обновлена')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при обновлении роли')
      }
    } catch (error) {
      console.error('Ошибка при обновлении роли:', error)
      toast.error('Ошибка при обновлении роли')
    }
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setUserFormOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users?id=${userToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Пользователь деактивирован')
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при деактивации пользователя')
      }
    } catch (error) {
      console.error('Ошибка при деактивации пользователя:', error)
      toast.error('Произошла ошибка при деактивации')
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleRestoreUser = (user: User) => {
    setUserToRestore(user)
    setRestoreDialogOpen(true)
  }

  const confirmRestoreUser = async () => {
    if (!userToRestore) return

    try {
      const response = await fetch(`/api/users/${userToRestore.id}/restore`, {
        method: 'PATCH',
      })

      if (response.ok) {
        toast.success('Пользователь восстановлен')
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при восстановлении пользователя')
      }
    } catch (error) {
      console.error('Ошибка при восстановлении пользователя:', error)
      toast.error('Произошла ошибка при восстановлении')
    } finally {
      setRestoreDialogOpen(false)
      setUserToRestore(null)
    }
  }

  const handleFormSuccess = () => {
    fetchUsers()
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <UserCog className="h-4 w-4" />
      case 'student':
        return <GraduationCap className="h-4 w-4" />
      case 'teacher':
      case 'lector':
      case 'assistant':
      case 'co_lecturer':
        return <BookOpen className="h-4 w-4" />
      case 'mentor':
        return <UserCheck className="h-4 w-4" />
      case 'education_office_head':
      case 'department_admin':
        return <UserCog className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'student':
        return 'bg-blue-100 text-blue-800'
      case 'teacher':
        return 'bg-purple-100 text-purple-800'
      case 'lector': // Обратная совместимость
        return 'bg-purple-100 text-purple-800'
      case 'assistant':
        return 'bg-indigo-100 text-indigo-800'
      case 'co_lecturer':
        return 'bg-violet-100 text-violet-800'
      case 'mentor':
        return 'bg-orange-100 text-orange-800'
      case 'education_office_head':
        return 'bg-green-100 text-green-800'
      case 'department_admin':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'student':
        return 'Студент'
      case 'teacher':
        return 'Преподаватель'
      case 'lector': // Обратная совместимость
        return 'Преподаватель (legacy)'
      case 'assistant':
        return 'Ассистент'
      case 'co_lecturer':
        return 'Со-преподаватель'
      case 'mentor':
        return 'Ментор'
      case 'education_office_head':
        return 'Учебный отдел'
      case 'department_admin':
        return 'Администратор кафедры'
      default:
        return role
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление пользователями</h1>
          <p className="text-gray-600">Просмотр и управление ролями пользователей системы</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-sm text-gray-600">
              Всего: {users.length} | Показано: {filteredUsers.length}
            </span>
          </div>
          <Button onClick={handleCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            Создать пользователя
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Фильтр по роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Администраторы</SelectItem>
                  <SelectItem value="student">Студенты</SelectItem>
                  <SelectItem value="teacher">Преподаватели</SelectItem>
                  <SelectItem value="assistant">Ассистенты</SelectItem>
                  <SelectItem value="co_lecturer">Со-преподаватели</SelectItem>
                  <SelectItem value="mentor">Менторы</SelectItem>
                  <SelectItem value="education_office_head">Учебный отдел</SelectItem>
                  <SelectItem value="department_admin">Администраторы кафедры</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="cursor-pointer">
                Показать удалённых
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список пользователей */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Пользователи не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const isInactive = user.isActive === false
            return (
            <Card key={user.id} className={isInactive ? 'opacity-60 border-gray-300' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(user.role)}
                      <CardTitle className={`text-lg ${isInactive ? 'text-gray-500' : ''}`}>
                        {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Без имени'}
                      </CardTitle>
                    </div>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {isInactive && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-600">
                        Удалён
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isInactive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreUser(user)}
                        title="Восстановить пользователя"
                      >
                        <RotateCcw className="h-4 w-4 text-green-600" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {!isInactive && (
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Администратор</SelectItem>
                          <SelectItem value="student">Студент</SelectItem>
                        <SelectItem value="teacher">Преподаватель</SelectItem>
                        <SelectItem value="assistant">Ассистент</SelectItem>
                        <SelectItem value="co_lecturer">Со-преподаватель</SelectItem>
                        <SelectItem value="mentor">Ментор</SelectItem>
                        <SelectItem value="education_office_head">Учебный отдел</SelectItem>
                        <SelectItem value="department_admin">Администратор кафедры</SelectItem>
                      </SelectContent>
                    </Select>
                    )}
                  </div>
                </div>
                <CardDescription>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                    {user.group && (
                      <p className="text-sm">
                        <span className="font-medium">Группа:</span> {user.group.name}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
            )
          })
        )}
      </div>

      {/* Форма пользователя */}
      <UserForm
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        user={editingUser}
        onSuccess={handleFormSuccess}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Деактивировать пользователя"
        description={`Вы уверены, что хотите деактивировать пользователя "${userToDelete?.name || userToDelete?.email}"? Пользователь не сможет войти в систему.`}
        confirmText="Деактивировать"
        cancelText="Отмена"
        onConfirm={confirmDeleteUser}
        variant="destructive"
      />

      {/* Диалог подтверждения восстановления */}
      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Восстановить пользователя"
        description={`Вы уверены, что хотите восстановить пользователя "${userToRestore?.name || userToRestore?.email}"? Пользователь снова сможет войти в систему.`}
        confirmText="Восстановить"
        cancelText="Отмена"
        onConfirm={confirmRestoreUser}
        variant="default"
      />
    </div>
  )
}
