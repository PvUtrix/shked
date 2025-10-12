'use client'

import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAnimationSettings } from '@/lib/stores/animation-store'

interface UsePageTransitionOptions {
  // Дополнительные опции для кастомизации
  fallbackToRouter?: boolean
  onTransitionStart?: () => void
  onTransitionEnd?: () => void
}

/**
 * Хук для управления переходами между страницами с View Transitions API
 * Автоматически применяет настройки анимации из store
 */
export function usePageTransition(options: UsePageTransitionOptions = {}) {
  const router = useRouter()
  const { enabled, isSupported, cssDuration, cssTransitionName } = useAnimationSettings()
  
  const {
    fallbackToRouter = true,
    onTransitionStart,
    onTransitionEnd
  } = options

  // Применяем CSS переменные для длительности анимации
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--transition-duration', cssDuration)
    }
  }, [cssDuration])

  /**
   * Переход на страницу с анимацией
   */
  const navigateWithTransition = useCallback(async (href: string) => {
    // Если анимации отключены или API не поддерживается
    if (!enabled || !isSupported) {
      if (fallbackToRouter) {
        router.push(href)
      }
      return
    }

    try {
      onTransitionStart?.()
      
      // Используем View Transitions API
      if (document.startViewTransition) {
        await document.startViewTransition(() => {
          router.push(href)
        }).finished
      } else {
        // Fallback для старых браузеров
        router.push(href)
      }
      
      onTransitionEnd?.()
    } catch (error) {
      console.warn('Ошибка при выполнении перехода:', error)
      // Fallback на обычную навигацию
      if (fallbackToRouter) {
        router.push(href)
      }
    }
  }, [enabled, isSupported, router, fallbackToRouter, onTransitionStart, onTransitionEnd])

  /**
   * Замена для router.back() с анимацией
   */
  const backWithTransition = useCallback(async () => {
    if (!enabled || !isSupported) {
      if (fallbackToRouter) {
        router.back()
      }
      return
    }

    try {
      onTransitionStart?.()
      
      if (document.startViewTransition) {
        await document.startViewTransition(() => {
          router.back()
        }).finished
      } else {
        router.back()
      }
      
      onTransitionEnd?.()
    } catch (error) {
      console.warn('Ошибка при возврате назад:', error)
      if (fallbackToRouter) {
        router.back()
      }
    }
  }, [enabled, isSupported, router, fallbackToRouter, onTransitionStart, onTransitionEnd])

  /**
   * Замена для router.replace() с анимацией
   */
  const replaceWithTransition = useCallback(async (href: string) => {
    if (!enabled || !isSupported) {
      if (fallbackToRouter) {
        router.replace(href)
      }
      return
    }

    try {
      onTransitionStart?.()
      
      if (document.startViewTransition) {
        await document.startViewTransition(() => {
          router.replace(href)
        }).finished
      } else {
        router.replace(href)
      }
      
      onTransitionEnd?.()
    } catch (error) {
      console.warn('Ошибка при замене страницы:', error)
      if (fallbackToRouter) {
        router.replace(href)
      }
    }
  }, [enabled, isSupported, router, fallbackToRouter, onTransitionStart, onTransitionEnd])

  return {
    // Основные методы навигации
    navigate: navigateWithTransition,
    back: backWithTransition,
    replace: replaceWithTransition,
    
    // Информация о поддержке
    isSupported,
    isEnabled: enabled,
    
    // Настройки анимации
    transitionName: cssTransitionName,
    duration: cssDuration
  }
}

/**
 * Хук для проверки поддержки View Transitions API
 */
export function useViewTransitionsSupport() {
  if (typeof document === 'undefined') {
    return false
  }
  
  return typeof document.startViewTransition === 'function'
}

/**
 * Хук для получения текущих настроек анимации
 */
export function useAnimationConfig() {
  return useAnimationSettings()
}
