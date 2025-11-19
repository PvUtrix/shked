'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, FileSpreadsheet, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonProps {
  endpoint: string
  params?: Record<string, string>
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showDropdown?: boolean
  exportTypes?: Array<{
    type: 'excel' | 'ical'
    label: string
    endpoint?: string
  }>
}

export function ExportButton({
  endpoint,
  params = {},
  label = 'Экспорт',
  variant = 'outline',
  size = 'default',
  showDropdown = false,
  exportTypes,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async (exportEndpoint: string, type: 'excel' | 'ical' = 'excel') => {
    setLoading(true)
    try {
      // Построить URL с параметрами
      const queryString = new URLSearchParams(params).toString()
      const url = queryString ? `${exportEndpoint}?${queryString}` : exportEndpoint

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Ошибка при экспорте')
      }

      // Получить имя файла из заголовка
      const contentDisposition = response.headers.get('content-disposition')
      let filename = type === 'excel' ? 'export.xlsx' : 'export.ics'

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=([^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''))
        }
      }

      // Скачать файл
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Файл успешно экспортирован')
    } catch (error) {
      console.error('Ошибка при экспорте:', error)
      toast.error('Не удалось экспортировать файл')
    } finally {
      setLoading(false)
    }
  }

  if (showDropdown && exportTypes && exportTypes.length > 1) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {exportTypes.map((exportType) => (
            <DropdownMenuItem
              key={exportType.type}
              onClick={() => handleExport(exportType.endpoint || endpoint, exportType.type)}
            >
              {exportType.type === 'excel' ? (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              {exportType.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => handleExport(endpoint)}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  )
}
