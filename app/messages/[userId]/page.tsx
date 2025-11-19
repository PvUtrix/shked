'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { getFullName } from '@/lib/utils'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    firstName: string | null
    lastName: string | null
    middleName: string | null
    email: string
    image: string | null
  }
  receiver: {
    id: string
    firstName: string | null
    lastName: string | null
    middleName: string | null
    email: string
    image: string | null
  }
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const userId = params.userId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    // Обновлять сообщения каждые 5 секунд
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])

        // Определить другого пользователя
        if (data.messages && data.messages.length > 0) {
          const firstMessage = data.messages[0]
          const other = firstMessage.senderId === session?.user?.id
            ? firstMessage.receiver
            : firstMessage.sender
          setOtherUser(other)
        }
      } else {
        toast.error('Не удалось загрузить сообщения')
      }
    } catch (error) {
      console.error('Ошибка при загрузке сообщений:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: userId,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage('')
        scrollToBottom()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Не удалось отправить сообщение')
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error)
      toast.error('Произошла ошибка при отправке')
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

    if (diffDays === 0) return 'Сегодня'
    if (diffDays === 1) return 'Вчера'
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
    <div className="space-y-4 h-[calc(100vh-12rem)]">
      {/* Заголовок */}
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/messages')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {otherUser && (
              <>
                <Avatar className="h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {(otherUser.firstName?.[0] || otherUser.email[0]).toUpperCase()}
                  </div>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {getFullName(otherUser) || otherUser.email}
                  </h2>
                  <p className="text-sm text-gray-500">{otherUser.email}</p>
                </div>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Сообщения */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-[calc(100vh-24rem)] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              Начните диалог, отправив первое сообщение
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.senderId === session?.user?.id
                const showDateDivider = index === 0 ||
                  formatMessageDate(messages[index - 1].createdAt) !== formatMessageDate(message.createdAt)

                return (
                  <div key={message.id}>
                    {/* Разделитель дат */}
                    {showDateDivider && (
                      <div className="text-center my-4">
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatMessageDate(message.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Сообщение */}
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <div
                          className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Форма отправки */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={sendMessage} className="flex items-center space-x-2">
            <Input
              placeholder="Введите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
