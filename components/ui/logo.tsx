'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'
import { useState } from 'react'

interface LogoProps {
  className?: string
  size?: number
  variant?: 'default' | 'white' | 'dark'
}

/**
 * Компонент логотипа приложения Шкед
 * Поддерживает различные варианты отображения и размеры
 * Если файл логотипа не найден, используется fallback иконка
 */
export function Logo({ className, size = 32, variant = 'default' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  
  // Пытаемся загрузить логотип, если не найден - используем fallback
  const logoSrc = '/logo.png'
  
  // Если изображение не загрузилось, используем fallback иконку
  if (imageError) {
    const iconColor = variant === 'white' 
      ? 'text-white' 
      : variant === 'dark' 
        ? 'text-gray-900' 
        : 'text-blue-600'
    
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <GraduationCap 
          className={cn('flex-shrink-0', iconColor)} 
          size={size} 
        />
      </div>
    )
  }
  
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Image
        src={logoSrc}
        alt="Логотип Шкед"
        width={size}
        height={size}
        className={cn(
          'object-contain flex-shrink-0',
          variant === 'white' && 'brightness-0 invert',
          variant === 'dark' && 'brightness-0'
        )}
        priority
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  )
}

/**
 * Компонент логотипа с текстом названия приложения
 */
interface LogoWithTextProps extends LogoProps {
  showText?: boolean
  textClassName?: string
}

export function LogoWithText({ 
  className, 
  size = 32, 
  variant = 'default',
  showText = true,
  textClassName
}: LogoWithTextProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Logo size={size} variant={variant} />
      {showText && (
        <span className={cn(
          'font-bold text-xl',
          variant === 'white' && 'text-white',
          variant === 'dark' && 'text-gray-900',
          variant === 'default' && 'text-gray-900',
          textClassName
        )}>
          Шкед
        </span>
      )}
    </div>
  )
}

