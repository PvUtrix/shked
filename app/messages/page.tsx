'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Search, MessageCircle, Loader2 } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import { toast } from 'sonner'

interface Conversation {
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    middleName: string | null
    email: string
    image: string | null
    role: string
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    senderId: string
  }
  unreadCount: number
}

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        toast.error('Не удалось загрузить диалоги')
      }
    } catch (error) {
      console.error('Ошибка при загрузке диалогов:', error)
      toast.error('Произошла ошибка при загрузке')
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    const userName = getFullName(conv.user) || conv.user.email
    return userName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин. назад`
    if (diffHours < 24) return `${diffHours} ч. назад`
    if (diffDays < 7) return `${diffDays} дн. назад`
    return date.toLocaleDateString('ru-RU')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Сообщения</h1>
        <p className="text-gray-600 mt-2">Личные диалоги с преподавателями и студентами</p>
      </div>

      {/* Поиск */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Список диалогов */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {searchTerm ? 'Диалоги не найдены' : 'У вас пока нет сообщений'}
              </p>
              <p className="text-gray-400">
                {searchTerm
                  ? 'Попробуйте изменить поисковый запрос'
                  : 'Начните новый диалог, написав сообщение'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.user.id}
              className="card-hover cursor-pointer"
              onClick={() => router.push(`/messages/${conversation.user.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Аватар */}
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                        {(conversation.user.firstName?.[0] || conversation.user.email[0]).toUpperCase()}
                      </div>
                    </Avatar>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Информация */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {getFullName(conversation.user) || conversation.user.email}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {getRoleLabel(conversation.user.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {conversation.lastMessage.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Администратор',
    student: 'Студент',
    lector: 'Преподаватель',
    assistant: 'Ассистент',
    co_lecturer: 'Со-преподаватель',
    mentor: 'Ментор',
    education_office_head: 'Учебный отдел',
    department_admin: 'Администратор кафедры',
  }
  return roleMap[role] || role
}
