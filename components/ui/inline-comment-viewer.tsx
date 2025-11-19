'use client'
import React from 'react'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, X, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  startOffset: number
  endOffset: number
  selectedText: string
  resolved: boolean
  createdAt: string
  author: {
    id: string
    name?: string
    firstName?: string
    lastName?: string
    email: string
  }
}

interface InlineCommentViewerProps {
  content: string
  submissionId: string
  homeworkId: string
  canComment?: boolean // Может ли пользователь оставлять комментарии
}

export function InlineCommentViewer({
  content,
  submissionId,
  homeworkId,
  canComment = false
}: InlineCommentViewerProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<{
    start: number
    end: number
    text: string
  } | null>(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/homework/${homeworkId}/submissions/${submissionId}/comments`)
        if (response.ok) {
          const data = await response.json()
          setComments(data.comments || [])
        }
      } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [submissionId, homeworkId])

  const handleTextSelection = () => {
    if (!canComment) return

    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) {
      setSelectedRange(null)
      return
    }

    const text = selection.toString()
    if (!text.trim()) {
      setSelectedRange(null)
      return
    }

    // Получаем позиции относительно всего контента
    const range = selection.getRangeAt(0)
    const preSelectionRange = range.cloneRange()
    preSelectionRange.selectNodeContents(contentRef.current!)
    preSelectionRange.setEnd(range.startContainer, range.startOffset)
    const start = preSelectionRange.toString().length

    setSelectedRange({
      start,
      end: start + text.length,
      text
    })
  }

  const handleAddComment = async () => {
    if (!selectedRange || !newCommentText.trim()) return

    try {
      const response = await fetch(`/api/homework/${homeworkId}/submissions/${submissionId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newCommentText,
          startOffset: selectedRange.start,
          endOffset: selectedRange.end,
          selectedText: selectedRange.text
        })
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments([...comments, newComment])
        setNewCommentText('')
        setSelectedRange(null)
        toast.success('Комментарий добавлен')
        
        // Снимаем выделение
        window.getSelection()?.removeAllRanges()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при добавлении комментария')
      }
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error)
      toast.error('Ошибка при добавлении комментария')
    }
  }

  const handleToggleResolved = async (commentId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/homework/${homeworkId}/submissions/${submissionId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resolved })
      })

      if (response.ok) {
        const updatedComment = await response.json()
        setComments(comments.map(c => c.id === commentId ? updatedComment : c))
        toast.success(resolved ? 'Комментарий помечен как решенный' : 'Комментарий помечен как нерешенный')
      }
    } catch (error) {
      console.error('Ошибка при обновлении комментария:', error)
      toast.error('Ошибка при обновлении комментария')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Удалить комментарий?')) return

    try {
      const response = await fetch(`/api/homework/${homeworkId}/submissions/${submissionId}/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId))
        toast.success('Комментарий удален')
      }
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error)
      toast.error('Ошибка при удалении комментария')
    }
  }

  const renderContentWithHighlights = () => {
    if (comments.length === 0) {
      return content
    }

    // Сортируем комментарии по позиции
    const sortedComments = [...comments].sort((a, b) => a.startOffset - b.startOffset)
    
    let result: React.ReactNode[] = []
    let lastIndex = 0

    sortedComments.forEach((comment, idx) => {
      // Добавляем текст до выделения
      if (comment.startOffset > lastIndex) {
        result.push(
          <span key={`text-${idx}`}>
            {content.substring(lastIndex, comment.startOffset)}
          </span>
        )
      }

      // Добавляем выделенный текст
      result.push(
        <mark
          key={`highlight-${comment.id}`}
          className={`cursor-pointer transition-colors ${
            comment.resolved 
              ? 'bg-green-100 hover:bg-green-200' 
              : 'bg-yellow-100 hover:bg-yellow-200'
          } ${activeCommentId === comment.id ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
          title={comment.content}
        >
          {content.substring(comment.startOffset, comment.endOffset)}
        </mark>
      )

      lastIndex = comment.endOffset
    })

    // Добавляем оставшийся текст
    if (lastIndex < content.length) {
      result.push(
        <span key="text-end">
          {content.substring(lastIndex)}
        </span>
      )
    }

    return result
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Контент с выделениями */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Работа студента
              </span>
              {canComment && (
                <Badge variant="secondary" className="text-xs">
                  Выделите текст для комментирования
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={contentRef}
              className="prose max-w-none whitespace-pre-wrap"
              onMouseUp={handleTextSelection}
            >
              {renderContentWithHighlights()}
            </div>

            {/* Форма добавления комментария */}
            {canComment && selectedRange && (
              <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                <p className="text-sm font-medium mb-2">
                  Выделенный текст: {'"'}{selectedRange.text.substring(0, 50)}
                  {selectedRange.text.length > 50 ? '...' : ''}{'"'}
                </p>
                <Textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Напишите комментарий..."
                  rows={3}
                  className="mb-2"
                />
                <div className="flex space-x-2">
                  <Button onClick={handleAddComment} size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Добавить комментарий
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedRange(null)
                      setNewCommentText('')
                      window.getSelection()?.removeAllRanges()
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Список комментариев */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>
              Комментарии ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500 text-sm">Загрузка комментариев...</p>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-sm">Комментариев пока нет</p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      activeCommentId === comment.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    } ${comment.resolved ? 'opacity-60' : ''}`}
                    onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-700">
                          {comment.author.name || 
                           `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() ||
                           comment.author.email}
                        </span>
                        {comment.resolved && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Решено
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2 italic">
                      {'"'}{comment.selectedText.substring(0, 30)}
                      {comment.selectedText.length > 30 ? '...' : ''}{'"'}
                    </p>
                    
                    <p className="text-sm text-gray-800">{comment.content}</p>
                    
                    {canComment && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleResolved(comment.id, !comment.resolved)
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          {comment.resolved ? 'Переоткрыть' : 'Решить'}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteComment(comment.id)
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

