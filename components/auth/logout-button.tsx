
'use client'

import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export interface LogoutButtonProps {
  collapsed?: boolean
}

export function LogoutButton({ collapsed = false }: LogoutButtonProps) {
  const t = useTranslations()
  
  return (
    <Button
      onClick={() => signOut()}
      variant="ghost"
      className={`w-full text-red-600 hover:text-red-700 hover:bg-red-50 ${
        collapsed ? 'justify-center px-2' : 'justify-start'
      }`}
      title={collapsed ? t('auth.logout.button') : undefined}
    >
      <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
      {!collapsed && t('auth.logout.button')}
    </Button>
  )
}
