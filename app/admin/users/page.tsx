'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu'
import { Search, Users, UserCheck, GraduationCap, BookOpen, UserCog, Plus, Edit, Trash2, RotateCcw, AlertTriangle, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { UserForm } from '@/components/admin/user-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { GdprDeleteDialog } from '@/components/ui/gdpr-delete-dialog'
import { getFullName } from '@/lib/utils'

interface User {
  id: string
  // name больше не используется
  email: string
  firstName: string | null
  lastName: string | null
  middleName?: string | null
  birthday?: string | null
  snils?: string | null
  sex?: string | null
  role: string
  groupId: string | null
  createdAt: string
  isActive?: boolean
  group?: {
    id: string
    name: string
  }
}

interface Group {
  id: string
  name: string
}

export default function UsersPage() {
  const t = useTranslations()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [sexFilter, setSexFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, inactive
  const [showInactive, setShowInactive] = useState(false)
  const [userFormOpen, setUserFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [userToRestore, setUserToRestore] = useState<User | null>(null)
  const [gdprDeleteDialogOpen, setGdprDeleteDialogOpen] = useState(false)
  const [userToGdprDelete, setUserToGdprDelete] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      // Если фильтр показывает неактивных или "все", загружаем всех пользователей
      const shouldIncludeInactive = showInactive || statusFilter === 'inactive' || statusFilter === 'all'
      const url = shouldIncludeInactive ? '/api/users?includeInactive=true' : '/api/users'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        toast.error(t('admin.pages.users.toast.loadError'))
      }
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error)
      toast.error(t('admin.pages.users.toast.loadError'))
    } finally {
      setLoading(false)
    }
  }, [showInactive, statusFilter, t])

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Синхронизируем showInactive с statusFilter
  useEffect(() => {
    if (statusFilter === 'inactive' && !showInactive) {
      setShowInactive(true)
    } else if (statusFilter === 'active' && showInactive) {
      // Если выбраны только активные, можно не включать неактивных
      // Но не сбрасываем showInactive автоматически, чтобы пользователь мог видеть неактивных
    }
  }, [statusFilter, showInactive])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Ошибка при загрузке групп:', error)
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
        toast.success(t('admin.pages.users.toast.roleUpdated'))
      } else {
        const error = await response.json()
        toast.error(error.error || t('admin.pages.users.toast.roleUpdateError'))
      }
    } catch (error) {
      console.error('Ошибка при обновлении роли:', error)
      toast.error(t('admin.pages.users.toast.roleUpdateError'))
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
        toast.success(t('admin.pages.users.toast.userDeleted'))
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || t('common.messages.errorOccurred'))
      }
    } catch (error) {
      console.error('Ошибка при деактивации пользователя:', error)
      toast.error(t('common.messages.errorOccurred'))
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
        toast.success(t('admin.pages.users.toast.userRestored'))
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || t('common.messages.errorOccurred'))
      }
    } catch (error) {
      console.error('Ошибка при восстановлении пользователя:', error)
      toast.error(t('common.messages.errorOccurred'))
    } finally {
      setRestoreDialogOpen(false)
      setUserToRestore(null)
    }
  }

  const handleGdprDeleteUser = (user: User) => {
    setUserToGdprDelete(user)
    setGdprDeleteDialogOpen(true)
  }

  const confirmGdprDeleteUser = async (confirmedName: string) => {
    if (!userToGdprDelete) return

    try {
      const response = await fetch(`/api/users/${userToGdprDelete.id}/gdpr-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: confirmedName }),
      })

      if (response.ok) {
        toast.success(t('admin.pages.users.toast.gdprDeleted'))
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || t('common.messages.errorOccurred'))
      }
    } catch (error) {
      console.error('Ошибка при GDPR удалении пользователя:', error)
      toast.error(t('common.messages.errorOccurred'))
    } finally {
      setGdprDeleteDialogOpen(false)
      setUserToGdprDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setEditingUser(null) // Сбрасываем editingUser после успешного сохранения
    fetchUsers() // Обновляем список пользователей
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <UserCog className="h-4 w-4" />
      case 'student':
        return <GraduationCap className="h-4 w-4" />
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
      case 'lector':
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
    const roleKey = role === 'co_lecturer' ? 'coLecturer' : 
                    role === 'education_office_head' ? 'educationOfficeHead' :
                    role === 'department_admin' ? 'departmentAdmin' : role
    
    return t(`ui.statusBadge.roles.${roleKey}`, { defaultValue: role })
  }

  const filteredUsers = users.filter(user => {
        // Поле name больше не используется - ищем только по компонентам имени
        const matchesSearch =
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.middleName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    const matchesGroup = groupFilter === 'all' || user.groupId === groupFilter
    
    const matchesSex = sexFilter === 'all' || user.sex === sexFilter
    
    // Фильтр по статусу: если showInactive выключен, показываем только активных
    // Если showInactive включен, применяем фильтр statusFilter
    let matchesStatus = true
    if (!showInactive) {
      // Если переключатель выключен, показываем только активных
      matchesStatus = user.isActive !== false
    } else {
      // Если переключатель включен, применяем фильтр статуса
      if (statusFilter === 'active') {
        matchesStatus = user.isActive !== false
      } else if (statusFilter === 'inactive') {
        matchesStatus = user.isActive === false
      }
      // Если statusFilter === 'all', matchesStatus остается true
    }
    
    return matchesSearch && matchesRole && matchesGroup && matchesSex && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.messages.loading')}</p>
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
          <div className="space-y-4">
            {/* Строка поиска */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('admin.pages.users.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Фильтры */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.pages.users.roleFilter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.filters.all')}</SelectItem>
                  <SelectItem value="admin">{t('ui.statusBadge.roles.admin')}</SelectItem>
                  <SelectItem value="student">{t('ui.statusBadge.roles.student')}</SelectItem>
                  <SelectItem value="lector">{t('ui.statusBadge.roles.lector')}</SelectItem>
                  <SelectItem value="assistant">{t('ui.statusBadge.roles.assistant')}</SelectItem>
                  <SelectItem value="co_lecturer">{t('ui.statusBadge.roles.coLecturer')}</SelectItem>
                  <SelectItem value="mentor">{t('ui.statusBadge.roles.mentor')}</SelectItem>
                  <SelectItem value="education_office_head">{t('ui.statusBadge.roles.educationOfficeHead')}</SelectItem>
                  <SelectItem value="department_admin">{t('ui.statusBadge.roles.departmentAdmin')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Группа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все группы</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sexFilter} onValueChange={setSexFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Пол" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="inactive">Неактивные</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Переключатель показа неактивных */}
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={(checked) => {
                  setShowInactive(checked)
                  // Если включаем показ неактивных и фильтр был "active", меняем на "all"
                  if (checked && statusFilter === 'active') {
                    setStatusFilter('all')
                  }
                  // Если выключаем показ неактивных, фильтруем только активных
                  if (!checked) {
                    setStatusFilter('active')
                  }
                }}
              />
              <Label htmlFor="show-inactive" className="cursor-pointer">
                {t('common.filters.showInactive')}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('admin.pages.users.noUsers')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Группа</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const isInactive = user.isActive === false
                  return (
                    <TableRow key={user.id} className={isInactive ? 'opacity-60' : ''}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(user.role)}
                          <span className={`font-medium ${isInactive ? 'text-gray-500' : ''}`}>
                            {getFullName(user) || 'Без имени'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.group ? (
                          <Badge variant="outline">{user.group.name}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isInactive ? (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600">
                            Удалён
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Активен
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {isInactive ? (
                              <DropdownMenuItem onClick={() => handleRestoreUser(user)}>
                                <RotateCcw className="h-4 w-4 mr-2 text-green-600" />
                                Восстановить
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Редактировать
                                </DropdownMenuItem>
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <UserCog className="h-4 w-4 mr-2" />
                                    Изменить роль
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'admin')}>
                                      Администратор
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'student')}>
                                      Студент
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'lector')}>
                                      Преподаватель
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'assistant')}>
                                      Ассистент
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'co_lecturer')}>
                                      Со-преподаватель
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'mentor')}>
                                      Ментор
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'education_office_head')}>
                                      Учебный отдел
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateUserRole(user.id, 'department_admin')}>
                                      Администратор кафедры
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuItem onClick={() => handleDeleteUser(user)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Деактивировать
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleGdprDeleteUser(user)}
                                  className="text-red-600"
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  GDPR удаление
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Форма пользователя */}
      <UserForm
        open={userFormOpen}
        onOpenChange={(open) => {
          setUserFormOpen(open)
          if (!open) {
            // Сбрасываем editingUser при закрытии формы
            setEditingUser(null)
          }
        }}
        user={editingUser}
        onSuccess={handleFormSuccess}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('admin.pages.users.deleteConfirm', { name: getFullName(userToDelete || {}) || userToDelete?.email || 'пользователь' })}
        description={t('admin.pages.users.deleteWarning')}
        onConfirm={confirmDeleteUser}
        variant="destructive"
      />

      {/* Диалог подтверждения восстановления */}
      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title={t('admin.pages.users.restoreConfirm', { name: getFullName(userToRestore || {}) || userToRestore?.email || 'пользователь' })}
        description=""
        onConfirm={confirmRestoreUser}
      />

      {/* Диалог GDPR удаления */}
      {userToGdprDelete && (
        <GdprDeleteDialog
          open={gdprDeleteDialogOpen}
          onOpenChange={setGdprDeleteDialogOpen}
          userName={getFullName(userToGdprDelete) || userToGdprDelete.email}
          userEmail={userToGdprDelete.email}
          onConfirm={confirmGdprDeleteUser}
        />
      )}
    </div>
  )
}
