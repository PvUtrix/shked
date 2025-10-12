
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
// import { useAnimationSettings } from '@/lib/stores/animation-store' // Временно отключен
import { Settings, Database, Users, Bell, Shield, MessageSquare, Send, BarChart3, TestTube, Palette, Zap } from 'lucide-react'

export default function SettingsPage() {
  const [telegramConfig, setTelegramConfig] = useState({
    telegramBotToken: '',
    openaiApiKey: '',
    isActive: false,
    notificationsEnabled: true,
    reminderMinutes: 30,
    dailySummaryTime: '07:00'
  })
  const [telegramStats, setTelegramStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  
  // Настройки анимаций - временно отключены
  // const {
  //   enabled: animationEnabled,
  //   type: animationType,
  //   speed: animationSpeed,
  //   setEnabled: setAnimationEnabled,
  //   setType: setAnimationType,
  //   setSpeed: setAnimationSpeed,
  //   reset: resetAnimationSettings,
  //   isSupported,
  //   cssDuration
  // } = useAnimationSettings()
  
  // Временные значения по умолчанию
  const animationEnabled = true
  const animationType = 'fade'
  const animationSpeed = 'fast'
  const setAnimationEnabled = (value: boolean) => {}
  const setAnimationType = (value: 'fade' | 'slide') => {}
  const setAnimationSpeed = (value: 'fast' | 'medium' | 'slow') => {}
  const resetAnimationSettings = () => {}
  const isSupported = false
  const cssDuration = '150ms'

  useEffect(() => {
    fetchTelegramConfig()
    fetchTelegramStats()
  }, [])

  const fetchTelegramConfig = async () => {
    try {
      const response = await fetch('/api/telegram/config')
      if (response.ok) {
        const data = await response.json()
        setTelegramConfig(data)
      }
    } catch (error) {
      console.error('Ошибка при получении конфигурации Telegram:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTelegramStats = async () => {
    try {
      const response = await fetch('/api/telegram/stats')
      if (response.ok) {
        const data = await response.json()
        setTelegramStats(data)
      }
    } catch (error) {
      console.error('Ошибка при получении статистики Telegram:', error)
    }
  }

  const saveTelegramConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramConfig)
      })
      
      if (response.ok) {
        alert('Настройки Telegram сохранены!')
        await fetchTelegramConfig()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setSaving(false)
    }
  }

  const sendTestMessage = async () => {
    if (!testMessage.trim()) {
      alert('Введите сообщение для теста')
      return
    }

    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          message: testMessage,
          testUserId: 'current' // В реальной реализации нужно получить ID текущего пользователя
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(result.message)
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка при отправке тестового сообщения:', error)
      alert('Ошибка при отправке тестового сообщения')
    }
  }

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      alert('Введите сообщение для рассылки')
      return
    }

    if (!confirm('Вы уверены, что хотите отправить рассылку всем пользователям?')) {
      return
    }

    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'broadcast_all',
          message: broadcastMessage
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Рассылка отправлена: ${result.message}`)
        setBroadcastMessage('')
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error('Ошибка при отправке рассылки:', error)
      alert('Ошибка при отправке рассылки')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем настройки...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Настройки системы
        </h1>
        <p className="text-gray-600 mt-2">
          Управляйте настройками и конфигурацией ШКЕД
        </p>
      </div>

      {/* Telegram Bot Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            Telegram Bot
          </CardTitle>
          <CardDescription>
            Настройка Telegram бота для уведомлений и взаимодействия с пользователями
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={telegramConfig.telegramBotToken}
                  onChange={(e) => setTelegramConfig(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Получите токен у @BotFather в Telegram
                </p>
              </div>
              
              <div>
                <Label htmlFor="gigachatKey">GigaChat API Key</Label>
                <Input
                  id="gigachatKey"
                  type="password"
                  placeholder="Ваш ключ GigaChat..."
                  value={telegramConfig.openaiApiKey}
                  onChange={(e) => setTelegramConfig(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Получите ключ на <a href="https://developers.sber.ru/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.sber.ru</a>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Бот активен</Label>
                <Switch
                  id="isActive"
                  checked={telegramConfig.isActive}
                  onCheckedChange={(checked) => setTelegramConfig(prev => ({ ...prev, isActive: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Уведомления включены</Label>
                <Switch
                  id="notifications"
                  checked={telegramConfig.notificationsEnabled}
                  onCheckedChange={(checked) => setTelegramConfig(prev => ({ ...prev, notificationsEnabled: checked }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reminderMinutes">Напоминание за (минут)</Label>
                <Input
                  id="reminderMinutes"
                  type="number"
                  min="5"
                  max="120"
                  value={telegramConfig.reminderMinutes}
                  onChange={(e) => setTelegramConfig(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                />
              </div>

              <div>
                <Label htmlFor="dailySummaryTime">Время дневной сводки</Label>
                <Input
                  id="dailySummaryTime"
                  type="time"
                  value={telegramConfig.dailySummaryTime}
                  onChange={(e) => setTelegramConfig(prev => ({ ...prev, dailySummaryTime: e.target.value }))}
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Webhook URL:</p>
                <p className="text-xs font-mono text-gray-600 break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/webhook` : 'Загрузка...'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveTelegramConfig} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Animation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2 text-purple-600" />
            Анимации интерфейса
          </CardTitle>
          <CardDescription>
            Настройка анимаций переходов между страницами для улучшения пользовательского опыта
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="animationEnabled">Включить анимации</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Плавные переходы между страницами
                  </p>
                </div>
                <Switch
                  id="animationEnabled"
                  checked={animationEnabled}
                  onCheckedChange={setAnimationEnabled}
                  disabled={!isSupported}
                />
              </div>

              {!isSupported && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ View Transitions API не поддерживается в вашем браузере. 
                    Обновите браузер для использования анимаций.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="animationType">Тип анимации</Label>
                <Select
                  value={animationType}
                  onValueChange={(value: 'fade' | 'slide') => setAnimationType(value)}
                  disabled={!animationEnabled || !isSupported}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        Плавное появление
                      </div>
                    </SelectItem>
                    <SelectItem value="slide">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        Скольжение
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="animationSpeed">Скорость анимации</Label>
                <Select
                  value={animationSpeed}
                  onValueChange={(value: 'fast' | 'medium' | 'slow') => setAnimationSpeed(value)}
                  disabled={!animationEnabled || !isSupported}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Быстрая (300ms)</SelectItem>
                    <SelectItem value="medium">Средняя (500ms)</SelectItem>
                    <SelectItem value="slow">Медленная (750ms)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Текущая длительность: {cssDuration}
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 Анимации используют View Transitions API для максимальной производительности
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetAnimationSettings}
                  disabled={!isSupported}
                >
                  Сбросить настройки
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Тест анимации - переход на ту же страницу
                    if (typeof document !== 'undefined' && document.startViewTransition) {
                      document.startViewTransition(() => {
                        // Простое обновление для демонстрации
                        window.location.reload()
                      })
                    }
                  }}
                  disabled={!animationEnabled || !isSupported}
                >
                  Тест анимации
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Statistics */}
      {telegramStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Статистика Telegram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {telegramStats.notificationStats?.activeUsers || 0}
                </div>
                <div className="text-sm text-gray-600">Подключенных пользователей</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {telegramStats.notificationStats?.notificationsEnabled || 0}
                </div>
                <div className="text-sm text-gray-600">С уведомлениями</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {telegramStats.notificationStats?.recentActivity || 0}
                </div>
                <div className="text-sm text-gray-600">Подключений за неделю</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {telegramStats.systemStats?.telegramConnectionRate || 0}%
                </div>
                <div className="text-sm text-gray-600">Процент подключений</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Telegram Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="h-5 w-5 mr-2 text-orange-600" />
            Тестирование Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="testMessage">Тестовое сообщение</Label>
            <div className="flex space-x-2">
              <Input
                id="testMessage"
                placeholder="Введите сообщение для теста"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
              <Button onClick={sendTestMessage} disabled={!testMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Отправить тест
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="broadcastMessage">Рассылка всем пользователям</Label>
            <div className="flex space-x-2">
              <Input
                id="broadcastMessage"
                placeholder="Введите сообщение для рассылки"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
              />
              <Button 
                onClick={sendBroadcast} 
                disabled={!broadcastMessage.trim()}
                variant="destructive"
              >
                <Send className="h-4 w-4 mr-2" />
                Отправить всем
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              База данных
            </CardTitle>
            <CardDescription>
              Управление данными системы и резервное копирование
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция экспорта данных будет реализована в следующей версии')}>
                Экспорт данных
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция импорта расписания будет реализована в следующей версии')}>
                Импорт расписания
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Кэш очищен успешно!')}>
                Очистить кэш
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Пользователи
            </CardTitle>
            <CardDescription>
              Управление пользователями и ролями
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция добавления администратора будет реализована в следующей версии')}>
                Добавить администратора
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция массового импорта студентов будет реализована в следующей версии')}>
                Массовый импорт студентов
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция управления ролями будет реализована в следующей версии')}>
                Управление ролями
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-orange-600" />
              Уведомления
            </CardTitle>
            <CardDescription>
              Настройка системы уведомлений
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email уведомления</span>
                <Button variant="outline" size="sm" onClick={() => alert('Email уведомления включены')}>
                  Включить
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">SMS уведомления</span>
                <Button variant="outline" size="sm" onClick={() => alert('SMS уведомления пока не поддерживаются')}>
                  Отключено
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Напоминания о занятиях</span>
                <Button variant="outline" size="sm" onClick={() => alert('Напоминания о занятиях включены')}>
                  Включить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-red-600" />
              Безопасность
            </CardTitle>
            <CardDescription>
              Настройки безопасности системы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция изменения пароля будет реализована в следующей версии')}>
                Изменить пароль
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция настройки сессии будет реализована в следующей версии')}>
                Настройки сессии
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => alert('Функция журнала действий будет реализована в следующей версии')}>
                Журнал действий
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-600" />
            Информация о системе
          </CardTitle>
          <CardDescription>
            Основная информация о ШКЕД
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">v1.1.0</div>
              <div className="text-sm text-gray-500">Версия системы</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">2025</div>
              <div className="text-sm text-gray-500">Год выпуска</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">Next.js + Telegram</div>
              <div className="text-sm text-gray-500">Технология</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
