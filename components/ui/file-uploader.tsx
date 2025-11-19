'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Upload, X, File, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>
  accept?: string
  maxSize?: number // в байтах
  className?: string
  disabled?: boolean
}

export function FileUploader({
  onUpload,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  maxSize = 10 * 1024 * 1024, // 10 МБ по умолчанию
  className,
  disabled = false
}: FileUploaderProps) {
  const t = useTranslations()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Форматирование размера файла
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Обработка выбора файла
  const handleFileChange = useCallback((selectedFile: File | null) => {
    // Валидация файла
    const validateFile = (file: File): string | null => {
      if (file.size > maxSize) {
        return t('ui.fileUploader.fileTooLarge', { maxSize: formatFileSize(maxSize) })
      }
      return null
    }

    setError(null)
    setSuccess(false)

    if (!selectedFile) {
      setFile(null)
      return
    }

    const validationError = validateFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }

    setFile(selectedFile)
  }, [maxSize, t])

  // Загрузка файла
  const handleUpload = async () => {
    if (!file || uploading) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      await onUpload(file)
      setSuccess(true)
      setFile(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ui.fileUploader.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }, [handleFileChange])

  // Удаление файла
  const handleRemove = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <Card
        className={cn(
          'relative border-2 border-dashed transition-colors',
          dragActive && 'border-primary bg-primary/5',
          error && 'border-destructive',
          success && 'border-green-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-6">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            className="hidden"
            disabled={disabled || uploading}
          />

          {!file ? (
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled || uploading}
                >
                  {t('ui.fileUploader.selectFile')}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('ui.fileUploader.orDragDrop')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('ui.fileUploader.maxSizeLabel', { maxSize: formatFileSize(maxSize) })}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <p>{t('ui.fileUploader.uploadSuccess')}</p>
        </div>
      )}

      {/* Кнопка загрузки */}
      {file && !success && (
        <Button
          onClick={handleUpload}
          disabled={uploading || disabled}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('ui.fileUploader.uploading')}
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t('ui.fileUploader.uploadFile')}
            </>
          )}
        </Button>
      )}
    </div>
  )
}


