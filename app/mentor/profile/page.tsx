'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Mail,
  Calendar,
  Users,
  Edit,
  Check
} from 'lucide-react'
import { getFullName } from '@/lib/utils'

type UserProfile = {
  id: string
  name?: string
  email: string
  firstName?: string
  lastName?: string
  middleName?: string
  birthday?: string
  snils?: string
  sex?: string
  role: string
  mentorGroupIds?: string[]
  createdAt: Date
  assignedGroups?: {
    id: string
    name: string
  }[]
}

export default function MentorProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    name: '',
    birthday: '',
    snils: '',
    sex: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          middleName: data.user.middleName || '',
          name: data.user.name || '',
          birthday: data.user.birthday ? new Date(data.user.birthday).toISOString().split('T')[0] : '',
          snils: data.user.snils || '',
          sex: data.user.sex || ''
        })
      }
    } catch (error) {
      console.error('Ошибка при получении профиля:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          name: formData.name,
          birthday: formData.birthday || null,
          snils: formData.snils,
          sex: formData.sex || null
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setEditing(false)
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.message || 'Не удалось сохранить изменения'}`)
      }
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error)
      alert('Произошла ошибка при сохранении профиля')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date: string | Date) => {
    try {
      return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return 'Дата не указана'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем профиль...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Профиль не найден</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Мой профиль
          </h1>
          <p className="text-gray-600 mt-2">
            Управление личной информацией и настройками
          </p>
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>
                Основные данные вашего профиля
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  {editing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Введите имя"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.firstName || 'Не указано'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  {editing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Введите фамилию"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.lastName || 'Не указано'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Отчество</Label>
                {editing ? (
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    placeholder="Введите отчество"
                  />
                ) : (
                  <p className="text-gray-900">{profile.middleName || 'Не указано'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Полное имя</Label>
                {editing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Введите полное имя"
                  />
                ) : (
                  <p className="text-gray-900">{profile.name || getFullName(profile) || 'Не указано'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthday">Дата рождения</Label>
                  {editing ? (
                    <Input
                      id="birthday"
                      type="date"
                      max={(() => {
                        // Максимальная дата: сегодня минус 10 лет
                        const today = new Date()
                        const maxDate = new Date(today)
                        maxDate.setFullYear(today.getFullYear() - 10)
                        return maxDate.toISOString().split('T')[0]
                      })()}
                      min={(() => {
                        // Минимальная дата: сегодня минус 150 лет
                        const today = new Date()
                        const minDate = new Date(today)
                        minDate.setFullYear(today.getFullYear() - 150)
                        return minDate.toISOString().split('T')[0]
                      })()}
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.birthday ? formatDate(profile.birthday) : 'Не указано'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sex">Пол</Label>
                  {editing ? (
                    <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите пол" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">{profile.sex === 'male' ? 'Мужской' : profile.sex === 'female' ? 'Женский' : 'Не указано'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="snils">СНИЛС</Label>
                {editing ? (
                  <Input
                    id="snils"
                    value={formData.snils}
                    onChange={(e) => setFormData({ ...formData, snils: e.target.value })}
                    placeholder="СНИЛС (только цифры)"
                  />
                ) : (
                  <p className="text-gray-900">{profile.snils || 'Не указано'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{profile.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Роль</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    Ментор
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Дата регистрации</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{formatDate(profile.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Мои группы */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span>Мои группы</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.assignedGroups && profile.assignedGroups.length > 0 ? (
                <div className="space-y-2">
                  {profile.assignedGroups.map(group => (
                    <div key={group.id} className="p-2 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{group.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Группы не назначены</p>
              )}
            </CardContent>
          </Card>

          {/* Статистика */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Групп</span>
                  <span className="font-semibold">{profile.assignedGroups?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Студентов</span>
                  <span className="font-semibold">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Занятий</span>
                  <span className="font-semibold">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Заданий</span>
                  <span className="font-semibold">-</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
