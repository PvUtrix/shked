import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Формирует полное имя пользователя из firstName + middleName + lastName
// Поле name больше не используется - используем только компоненты имени
export function getFullName(user: {
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
}): string {
  const parts = [
    user.firstName,
    user.middleName,
    user.lastName
  ].filter(Boolean)
  
  return parts.length > 0 ? parts.join(' ') : ''
}