'use client'

import { useState, useLayoutEffect } from 'react'

/**
 * Хук для управления состоянием сайдбара
 * Сохраняет состояние в localStorage
 * Использует useLayoutEffect для синхронизации состояния ДО первой отрисовки на клиенте
 */
export function useSidebar() {
  // Инициализируем с false - это будет использоваться на сервере и при первой гидратации
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Используем useLayoutEffect для синхронной загрузки ДО первой отрисовки
  // Это предотвращает видимые изменения при гидратации
  useLayoutEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('sidebar-collapsed')
      if (saved !== null) {
        setIsCollapsed(saved === 'true')
      }
    } catch (error) {
      // localStorage может быть недоступен в некоторых случаях
      console.error('Ошибка при загрузке состояния сайдбара:', error)
    }
  }, [])

  // Сохраняем состояние в localStorage при изменении
  const toggle = () => {
    if (!mounted) return
    setIsCollapsed((prev) => {
      const newValue = !prev
      try {
        localStorage.setItem('sidebar-collapsed', String(newValue))
      } catch (error) {
        console.error('Ошибка при сохранении состояния сайдбара:', error)
      }
      return newValue
    })
  }

  return {
    // На сервере и до первого useLayoutEffect всегда false
    // После useLayoutEffect - значение из localStorage или false по умолчанию
    isCollapsed: mounted ? isCollapsed : false,
    toggle,
    mounted
  }
}

