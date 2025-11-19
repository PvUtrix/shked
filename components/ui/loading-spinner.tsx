'use client'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Компонент спиннера загрузки
 * Используется на всех страницах для единообразного отображения состояния загрузки
 */
export function LoadingSpinner({ 
  message = 'Загрузка...', 
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto ${sizeClasses[size]}`}></div>
        {message && <p className="mt-2 text-gray-600">{message}</p>}
      </div>
    </div>
  )
}

