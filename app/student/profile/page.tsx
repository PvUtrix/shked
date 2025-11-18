
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCircle, Mail, User, Users, BookOpen, Calendar, Save, MessageSquare, Copy, Check, HandHeart, Search } from 'lucide-react'
import { getFullName } from '@/lib/utils'

interface UserGroup {
  subgroupCommerce?: number | null
  subgroupTutorial?: number | null
  subgroupFinance?: number | null
  subgroupSystemThinking?: number | null
  group: {
    name: string
    description?: string
    semester?: string
    year?: string
  }
}

interface TelegramUser {
  id: string
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
  isActive: boolean
  notifications: boolean
  createdAt: string
}

interface MaxUser {
  id: string
  maxId: string
  username?: string
  firstName?: string
  lastName?: string
  isActive: boolean
  notifications: boolean
  createdAt: string
}

export default function StudentProfilePage() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(true)
  const [userGroup, setUserGroup] = useState<UserGroup | null>(null)
  const [scheduleCount, setScheduleCount] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    birthday: '',
    snils: '',
    sex: '',
    canHelp: '',
    lookingFor: ''
  })
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [deepLinkUrl, setDeepLinkUrl] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [telegramLoading, setTelegramLoading] = useState(false)

  const [maxUser, setMaxUser] = useState<MaxUser | null>(null)
  const [maxLinkToken, setMaxLinkToken] = useState<string | null>(null)
  const [maxTokenCopied, setMaxTokenCopied] = useState(false)
  const [maxLoading, setMaxLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setFormData({
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        middleName: '',
        email: session.user.email || '',
        birthday: '',
        snils: '',
        sex: '',
        canHelp: '',
        lookingFor: ''
      })
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      // Загружаем данные профиля
      const profileResponse = await fetch('/api/profile')
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setFormData(prev => ({
          ...prev,
          firstName: profileData.user.firstName || '',
          lastName: profileData.user.lastName || '',
          middleName: profileData.user.middleName || '',
          birthday: profileData.user.birthday ? new Date(profileData.user.birthday).toISOString().split('T')[0] : '',
          snils: profileData.user.snils || '',
          sex: profileData.user.sex || '',
          canHelp: profileData.user.canHelp || '',
          lookingFor: profileData.user.lookingFor || ''
        }))
      }

      // Здесь можно получить дополнительные данные пользователя
      // Пока используем заглушку
      setUserGroup({
        subgroupCommerce: 1,
        subgroupTutorial: 1,
        subgroupFinance: 1,
        subgroupSystemThinking: 1,
        group: {
          name: 'ТехПред МФТИ 2025-27',
          description: 'Магистратура Технологическое предпринимательство',
          semester: '1 семестр',
          year: '2025-27'
        }
      })
      setScheduleCount(15)
      
      // Проверяем статус Telegram подключения
      await checkTelegramStatus()
      // Проверяем статус Max подключения
      await checkMaxStatus()
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkTelegramStatus = async () => {
    try {
      const response = await fetch('/api/telegram/link')
      if (response.ok) {
        const data = await response.json()
        if (data.telegramUser) {
          setTelegramUser(data.telegramUser)
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса Telegram:', error)
    }
  }

  const checkMaxStatus = async () => {
    try {
      const response = await fetch('/api/max/link')
      if (response.ok) {
        const data = await response.json()
        if (data.maxUser) {
          setMaxUser(data.maxUser)
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса Max:', error)
    }
  }

  const generateLinkToken = async () => {
    setTelegramLoading(true)
    try {
      const response = await fetch('/api/telegram/link', {
        method: 'GET'
      })

      if (response.ok) {
        const data = await response.json()
        setLinkToken(data.token)
        setDeepLinkUrl(data.deepLinkUrl || null)
      } else {
        console.error('Ошибка при генерации токена')
      }
    } catch (error) {
      console.error('Ошибка при генерации токена:', error)
    } finally {
      setTelegramLoading(false)
    }
  }

  const generateMaxLinkToken = async () => {
    setMaxLoading(true)
    try {
      const response = await fetch('/api/max/link', {
        method: 'GET'
      })

      if (response.ok) {
        const data = await response.json()
        setMaxLinkToken(data.token)
      } else {
        console.error('Ошибка при генерации Max токена')
      }
    } catch (error) {
      console.error('Ошибка при генерации Max токена:', error)
    } finally {
      setMaxLoading(false)
    }
  }

  const copyToken = async () => {
    if (linkToken) {
      await navigator.clipboard.writeText(linkToken)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    }
  }

  const copyMaxToken = async () => {
    if (maxLinkToken) {
      await navigator.clipboard.writeText(maxLinkToken)
      setMaxTokenCopied(true)
      setTimeout(() => setMaxTokenCopied(false), 2000)
    }
  }

  const handleSave = async () => {
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
          birthday: formData.birthday || null,
          snils: formData.snils,
          sex: formData.sex || null,
          canHelp: formData.canHelp,
          lookingFor: formData.lookingFor
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Профиль успешно обновлен:', result)
        setIsEditing(false)
        // Можно добавить уведомление об успешном сохранении
      } else {
        const error = await response.json()
        console.error('Ошибка при сохранении профиля:', error)
        // Можно добавить уведомление об ошибке
      }
    } catch (error) {
      console.error('Ошибка при сохранении профиля:', error)
      // Можно добавить уведомление об ошибке
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем профиль...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Мой профиль
        </h1>
        <p className="text-gray-600 mt-2">
          Управляйте своими данными и настройками
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Личная информация
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      handleSave()
                    } else {
                      setIsEditing(true)
                    }
                  }}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить
                    </>
                  ) : (
                    'Редактировать'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <UserCircle className="h-16 w-16 text-gray-400" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {getFullName(session?.user || {}) || 'Студент'}
                  </h3>
                  <p className="text-gray-500">Студент</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.firstName || 'Не указано'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.lastName || 'Не указано'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Отчество
                </label>
                {isEditing ? (
                  <Input
                    value={formData.middleName}
                    onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                    placeholder="Отчество"
                  />
                ) : (
                  <p className="text-gray-900">{formData.middleName || 'Не указано'}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата рождения
                  </label>
                  {isEditing ? (
                    <Input
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
                      onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                    />
                  ) : (
                    <p className="text-gray-900">{formData.birthday ? new Date(formData.birthday).toLocaleDateString('ru-RU') : 'Не указано'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пол
                  </label>
                  {isEditing ? (
                    <Select value={formData.sex} onValueChange={(value) => setFormData(prev => ({ ...prev, sex: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите пол" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">{formData.sex === 'male' ? 'Мужской' : formData.sex === 'female' ? 'Женский' : 'Не указано'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  СНИЛС
                </label>
                {isEditing ? (
                  <Input
                    value={formData.snils}
                    onChange={(e) => setFormData(prev => ({ ...prev, snils: e.target.value }))}
                    placeholder="СНИЛС (только цифры)"
                  />
                ) : (
                  <p className="text-gray-900">{formData.snils || 'Не указано'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-gray-900">{formData.email || 'Не указано'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <HandHeart className="h-4 w-4 mr-2 text-green-600" />
                  Чем могу быть полезен
                </label>
                {isEditing ? (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Опишите свои навыки, опыт и чем можете помочь другим студентам..."
                    value={formData.canHelp}
                    onChange={(e) => setFormData(prev => ({ ...prev, canHelp: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-900 min-h-[3rem] p-3 bg-gray-50 rounded-md">
                    {formData.canHelp || 'Не указано'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-blue-600" />
                  Что ищу
                </label>
                {isEditing ? (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Опишите, что вы ищете: помощь в учебе, проекты, команду, стажировки..."
                    value={formData.lookingFor}
                    onChange={(e) => setFormData(prev => ({ ...prev, lookingFor: e.target.value }))}
                  />
                ) : (
                  <p className="text-gray-900 min-h-[3rem] p-3 bg-gray-50 rounded-md">
                    {formData.lookingFor || 'Не указано'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Статистика
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{scheduleCount}</div>
                  <div className="text-sm text-gray-600">Занятий в семестре</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">85%</div>
                  <div className="text-sm text-gray-600">Посещаемость</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">7</div>
                  <div className="text-sm text-gray-600">Предметов</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Group Info */}
      {userGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Информация о группе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {userGroup.group.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {userGroup.group.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Семестр:</span>
                    <span className="font-medium">{userGroup.group.semester}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Год обучения:</span>
                    <span className="font-medium">{userGroup.group.year}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Подгруппы:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Коммерциализация:</span>
                    <span className="font-medium">Подгруппа {userGroup.subgroupCommerce}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Тьюториал:</span>
                    <span className="font-medium">Подгруппа {userGroup.subgroupTutorial}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Финансы:</span>
                    <span className="font-medium">Подгруппа {userGroup.subgroupFinance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Системное мышление:</span>
                    <span className="font-medium">Подгруппа {userGroup.subgroupSystemThinking}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Telegram Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Telegram уведомления
          </CardTitle>
          <CardDescription>
            Подключите Telegram для получения уведомлений о расписании
          </CardDescription>
        </CardHeader>
        <CardContent>
          {telegramUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">Telegram подключен</p>
                    <p className="text-sm text-green-700">
                      @{telegramUser.username || 'пользователь'} • Подключен {new Date(telegramUser.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={telegramUser.notifications}
                    onCheckedChange={(checked) => {
                      // Здесь можно добавить API для изменения настроек
                      console.log('Изменение настроек уведомлений:', checked)
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    {telegramUser.notifications ? 'Включены' : 'Отключены'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Открыть бота
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  Отключить Telegram
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Подключение Telegram</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Получайте уведомления о расписании, изменениях и напоминания прямо в Telegram
                </p>
                
                {linkToken ? (
                  <div className="space-y-3">
                    {deepLinkUrl ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="flex items-center mb-2">
                            <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                            <p className="font-medium text-blue-900">Автоматическая привязка</p>
                          </div>
                          <p className="text-sm text-blue-700 mb-3">
                            Нажмите кнопку ниже для подключения в один клик
                          </p>
                          <Button
                            onClick={() => window.open(deepLinkUrl, '_blank')}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Подключить через Telegram
                          </Button>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-blue-50 text-gray-500">или</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-600">Токен привязки:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyToken}
                          className="h-8"
                        >
                          {tokenCopied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-2 break-all">
                        {linkToken}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Ручная привязка:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Откройте Telegram бота</li>
                        <li>Отправьте команду <code className="bg-gray-100 px-1 rounded">/link</code></li>
                        <li>Введите токен выше</li>
                        <li>Ваш аккаунт будет привязан</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={generateLinkToken}
                    disabled={telegramLoading}
                    className="w-full"
                  >
                    {telegramLoading ? 'Генерация токена...' : 'Получить токен привязки'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Max Messenger Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
            Max Messenger уведомления
          </CardTitle>
          <CardDescription>
            Подключите Max Messenger для получения уведомлений о расписании
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maxUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-green-900">Max подключен</p>
                    <p className="text-sm text-green-700">
                      @{maxUser.username || 'пользователь'} • Подключен {new Date(maxUser.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={maxUser.notifications}
                    onCheckedChange={(checked) => {
                      console.log('Изменение настроек Max уведомлений:', checked)
                    }}
                  />
                  <span className="text-sm text-gray-600">
                    {maxUser.notifications ? 'Включены' : 'Отключены'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Открыть бота
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  Отключить Max
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Подключение Max Messenger</h4>
                <p className="text-sm text-purple-700 mb-4">
                  Получайте уведомления о расписании, изменениях и напоминания прямо в Max Messenger
                </p>

                {maxLinkToken ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-600">Токен привязки:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyMaxToken}
                          className="h-8"
                        >
                          {maxTokenCopied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded mt-2 break-all">
                        {maxLinkToken}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-2">Инструкция:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Откройте Max Messenger бота</li>
                        <li>Отправьте команду <code className="bg-gray-100 px-1 rounded">/link</code></li>
                        <li>Введите токен выше</li>
                        <li>Ваш аккаунт будет привязан</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={generateMaxLinkToken}
                    disabled={maxLoading}
                    className="w-full"
                  >
                    {maxLoading ? 'Генерация токена...' : 'Получить токен привязки'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
            Быстрые действия
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Экспорт расписания
            </Button>
            <Button variant="outline" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Настройки уведомлений
            </Button>
            <Button variant="outline" className="justify-start">
              <BookOpen className="h-4 w-4 mr-2" />
              Справка
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
