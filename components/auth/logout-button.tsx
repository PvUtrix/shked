
'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <Button
      onClick={() => signOut()}
      variant="ghost"
      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <LogOut className="h-5 w-5 mr-3" />
      Выйти
    </Button>
  )
}
