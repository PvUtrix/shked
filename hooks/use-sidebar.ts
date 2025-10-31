'use client'

import { useState, useEffect } from 'react'

/**
 * Хук для управления состоянием сайдбара
 * Сохраняет состояние в localStorage
 */
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Загружаем состояние из localStorage после монтирования
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  // Сохраняем состояние в localStorage при изменении
  const toggle = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev
      localStorage.setItem('sidebar-collapsed', String(newValue))
      return newValue
    })
  }

  return {
    isCollapsed: mounted ? isCollapsed : false, // Предотвращаем гидрацию SSR
    toggle,
    mounted
  }
}

