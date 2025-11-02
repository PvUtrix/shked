'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations()
  const [inputName, setInputName] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!inputName.trim()) {
      setError(t('ui.gdprDeleteDialog.userNameRequired'))
      return
    }

    if (inputName.trim().toLowerCase() !== userName.toLowerCase()) {
      setError(t('ui.gdprDeleteDialog.userNameMismatch'))
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
            {t('ui.gdprDeleteDialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold text-gray-900">
              {t('ui.gdprDeleteDialog.warning')}
            </p>
            <p>
              {t('ui.gdprDeleteDialog.userToDelete', { userName, userEmail })}
            </p>
            <p className="text-sm text-gray-600">
              {t('ui.gdprDeleteDialog.confirmationPrompt')}
            </p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-name">{t('ui.gdprDeleteDialog.userNameLabel')}</Label>
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
              <p className="font-semibold text-yellow-800 mb-1">{t('ui.gdprDeleteDialog.whatWillBeDeleted')}</p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>{t('ui.gdprDeleteDialog.whatWillBeDeletedItems.personalData')}</li>
                <li>{t('ui.gdprDeleteDialog.whatWillBeDeletedItems.accounts')}</li>
                <li>{t('ui.gdprDeleteDialog.whatWillBeDeletedItems.telegram')}</li>
                <li>{t('ui.gdprDeleteDialog.whatWillBeDeletedItems.groupConnections')}</li>
              </ul>
              <p className="font-semibold text-yellow-800 mt-2 mb-1">{t('ui.gdprDeleteDialog.whatWillBeSaved')}</p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>{t('ui.gdprDeleteDialog.whatWillBeSavedItems.academicData')}</li>
                <li>{t('ui.gdprDeleteDialog.whatWillBeSavedItems.attendance')}</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('ui.gdprDeleteDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700"
            disabled={!inputName.trim() || inputName.trim().toLowerCase() !== userName.toLowerCase()}
          >
            {t('ui.gdprDeleteDialog.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

