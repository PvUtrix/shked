"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

/**
 * Обертка над NextThemesProvider для предотвращения гидратационных ошибок
 * Ожидает монтирования перед применением темы
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // До монтирования возвращаем children без ThemeProvider
  // Это предотвращает несоответствие между сервером и клиентом
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
