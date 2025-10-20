'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Типы для настроек анимации
export type AnimationType = 'fade' | 'slide'
export type AnimationSpeed = 'fast' | 'medium' | 'slow'

interface AnimationSettings {
  enabled: boolean
  type: AnimationType
  speed: AnimationSpeed
}

interface AnimationStore extends AnimationSettings {
  // Действия для изменения настроек
  setEnabled: (enabled: boolean) => void
  setType: (type: AnimationType) => void
  setSpeed: (speed: AnimationSpeed) => void
  reset: () => void
  
  // Геттеры для удобства
  getDuration: () => number
  getTransitionName: () => string
}

// Начальные настройки
const defaultSettings: AnimationSettings = {
  enabled: true,
  type: 'fade',
  speed: 'fast'
}

// Маппинг скорости в миллисекундах
const speedMap: Record<AnimationSpeed, number> = {
  fast: 300,
  medium: 500,
  slow: 750
}

// Маппинг типа анимации в CSS transition name
const typeMap: Record<AnimationType, string> = {
  fade: 'fade-transition',
  slide: 'slide-transition'
}

export const useAnimationStore = create<AnimationStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      setEnabled: (enabled) => set({ enabled }),
      setType: (type) => set({ type }),
      setSpeed: (speed) => set({ speed }),
      
      reset: () => set(defaultSettings),
      
      getDuration: () => speedMap[get().speed],
      getTransitionName: () => typeMap[get().type]
    }),
    {
      name: 'shked-animation-settings',
      version: 1,
      // Сохраняем только необходимые поля
      partialize: (state) => ({
        enabled: state.enabled,
        type: state.type,
        speed: state.speed
      })
    }
  )
)

// Хук для удобного доступа к настройкам
export const useAnimationSettings = () => {
  const store = useAnimationStore()
  
  return {
    ...store,
    // Дополнительные геттеры
    isSupported: typeof document !== 'undefined' && typeof document.startViewTransition === 'function',
    cssDuration: `${store.getDuration()}ms`,
    cssTransitionName: store.getTransitionName()
  }
}
