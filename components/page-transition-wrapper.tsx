'use client'
import React from 'react'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { usePageTransition } from '@/hooks/use-page-transition'

interface PageTransitionWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * Компонент-обертка для автоматического применения View Transitions
 * Перехватывает клики по ссылкам и применяет анимации
 */
export function PageTransitionWrapper({ 
  children, 
  className = '' 
}: PageTransitionWrapperProps) {
  const pathname = usePathname()
  const { navigate, isEnabled, isSupported } = usePageTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  // Обработчик кликов по ссылкам
  const handleLinkClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement
    const link = target.closest('a[href]') as HTMLAnchorElement
    
    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    // Проверяем, что это внутренняя ссылка
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }

    // Проверяем, что это не та же страница
    if (href === pathname) {
      return
    }

    // Предотвращаем стандартное поведение
    event.preventDefault()
    
    // Применяем переход с анимацией
    navigate(href)
  }, [navigate, pathname])

  // Применяем обработчик кликов
  useEffect(() => {
    const container = containerRef.current
    if (!container || !isEnabled || !isSupported) return

    container.addEventListener('click', handleLinkClick, true)
    
    return () => {
      container.removeEventListener('click', handleLinkClick, true)
    }
  }, [handleLinkClick, isEnabled, isSupported])

  // Применяем CSS класс для transition name
  const { transitionName } = usePageTransition()

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    if (transitionName) {
      root.style.setProperty('view-transition-name', transitionName)
    }

    // Отладочная информация
    console.error('View Transitions Support Check:', {
      hasStartViewTransition: typeof document.startViewTransition === 'function',
      documentStartViewTransition: document.startViewTransition,
      isSupported,
      isEnabled
    })

    return () => {
      root.style.removeProperty('view-transition-name')
    }
  }, [isSupported, isEnabled, transitionName])

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{
        // Устанавливаем view-transition-name для корневого элемента
        viewTransitionName: 'root'
      }}
    >
      {children}
    </div>
  )
}

/**
 * Хук для ручного применения переходов
 * Используется в компонентах, где нужен контроль над навигацией
 */
export function useTransitionNavigation() {
  const { navigate, back, replace, isEnabled, isSupported } = usePageTransition()

  return {
    // Методы навигации с анимацией
    navigateTo: navigate,
    goBack: back,
    replaceWith: replace,
    
    // Информация о поддержке
    canAnimate: isEnabled && isSupported,
    isSupported,
    isEnabled
  }
}

/**
 * Компонент для отображения индикатора загрузки во время переходов
 */
export function TransitionLoader() {
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const handleTransitionStart = () => setIsTransitioning(true)
    const handleTransitionEnd = () => setIsTransitioning(false)

    // Слушаем события переходов
    document.addEventListener('view-transition-start', handleTransitionStart)
    document.addEventListener('view-transition-end', handleTransitionEnd)

    return () => {
      document.removeEventListener('view-transition-start', handleTransitionStart)
      document.removeEventListener('view-transition-end', handleTransitionEnd)
    }
  }, [])

  if (!isTransitioning) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        <span className="text-sm text-gray-600">Загрузка...</span>
      </div>
    </div>
  )
}
