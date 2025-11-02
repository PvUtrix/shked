'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface GdprDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  userEmail: string
  onConfirm: (confirmedName: string) => void
}

export function GdprDeleteDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  onConfirm,
}: GdprDeleteDialogProps) {
  const [inputName, setInputName] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!inputName.trim()) {
      setError('Введите имя пользователя для подтверждения')
      return
    }

    if (inputName.trim().toLowerCase() !== userName.toLowerCase()) {
      setError('Имя не совпадает. Введите точное имя пользователя.')
      return
    }

    onConfirm(inputName.trim())
    setInputName('')
    setError('')
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setInputName('')
      setError('')
    }
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            ⚠️ GDPR Удаление пользователя
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold text-gray-900">
              Это действие удалит все персональные данные пользователя навсегда!
            </p>
            <p>
              Удаляемый пользователь: <strong>{userName}</strong> ({userEmail})
            </p>
            <p className="text-sm text-gray-600">
              Для подтверждения удаления введите точное имя пользователя:
            </p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-name">Имя пользователя</Label>
              <Input
                id="confirm-name"
                value={inputName}
                onChange={(e) => {
                  setInputName(e.target.value)
                  setError('')
                }}
                placeholder={userName}
                className={error ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirm()
                  }
                }}
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
              <p className="font-semibold text-yellow-800 mb-1">Что будет удалено:</p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Все персональные данные (имя, email, пароль)</li>
                <li>Аккаунты и сессии</li>
                <li>Telegram данные</li>
                <li>Связи с группами</li>
              </ul>
              <p className="font-semibold text-yellow-800 mt-2 mb-1">Что будет сохранено (анонимизировано):</p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Учебные данные (работы, комментарии, оценки)</li>
                <li>Посещаемость и результаты экзаменов</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={!inputName.trim() || inputName.trim().toLowerCase() !== userName.toLowerCase()}
          >
            Удалить персональные данные
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

