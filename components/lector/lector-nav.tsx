'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { LogoutButton } from '@/components/auth/logout-button'
import { 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  User,
  GraduationCap,
  UserCircle
} from 'lucide-react'

const navItems = [
  {
    label: 'Мои предметы',
    href: '/lector',
    icon: BookOpen
  },
  {
    label: 'Расписание',
    href: '/lector/schedule',
    icon: Calendar
  },
  {
    label: 'Домашние задания',
    href: '/lector/homework',
    icon: ClipboardList
  },
  {
    label: 'Профиль',
    href: '/lector/profile',
    icon: User
  }
]

interface LectorNavProps {
  user?: {
    name?: string
    email?: string
  }
}

export function LectorNav({ user }: LectorNavProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <GraduationCap className="h-8 w-8 text-purple-600" />
          <h1 className="text-xl font-bold text-gray-900">Шкед</h1>
        </div>
        
        <Card className="mb-6 bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UserCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">{user?.name || 'Преподаватель'}</p>
                <p className="text-sm text-gray-500">Преподаватель</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
