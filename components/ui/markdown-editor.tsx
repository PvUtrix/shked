'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import '@mdxeditor/editor/style.css'

// Динамический импорт всего компонента для избежания SSR проблем
// В Next.js 16 ssr: false недопустим в Server Components, поэтому используем обычный dynamic import
// Защита от hydration mismatch уже реализована через mounted state
const MDXEditorWrapper = dynamic(
  () => import('./markdown-editor-client'),
  {
    loading: () => (
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Загрузка редактора...</div>
      </div>
    )
  }
)

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
  height?: string
}

export function MarkdownEditor(props: MarkdownEditorProps) {
  const [mounted, setMounted] = useState(false)

  // Избегаем hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center border border-gray-200 dark:border-gray-700">
        <div className="text-gray-600 dark:text-gray-400">Подготовка редактора...</div>
      </div>
    )
  }

  return <MDXEditorWrapper {...props} />
}
