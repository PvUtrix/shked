'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { LogoutButton } from '@/components/auth/logout-button'
import { useSidebar } from '@/hooks/use-sidebar'
import { 
  Users, 
  Calendar, 
  User, 
  ClipboardList,
  GraduationCap,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navItems = [
  {
    label: 'Мои группы',
    href: '/mentor',
    icon: Users
  },
  {
    label: 'Расписание',
    href: '/mentor/schedule',
    icon: Calendar
  },
  {
    label: 'Студенты',
    href: '/mentor/students',
    icon: User
  },
  {
    label: 'Домашние задания',
    href: '/mentor/homework',
    icon: ClipboardList
  },
  {
    label: 'Профиль',
    href: '/mentor/profile',
    icon: User
  }
]

interface MentorNavProps {
  user?: {
    name?: string
    email?: string
  }
}

export function MentorNav({ user }: MentorNavProps) {
  const pathname = usePathname()
  const { isCollapsed, toggle } = useSidebar()

  return (
    <aside className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className={`p-6 ${isCollapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <GraduationCap className="h-8 w-8 text-orange-600 flex-shrink-0" />
          {!isCollapsed && <h1 className="text-xl font-bold text-gray-900">Шкед</h1>}
        </div>
        
        {/* Кнопка сворачивания */}
        <button
          onClick={toggle}
          className="w-full mb-6 p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label={isCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 text-gray-600 mr-2" />
              <span className="text-sm text-gray-600">Свернуть</span>
            </>
          )}
        </button>

        {/* Карточка пользователя */}
        {!isCollapsed ? (
          <Card className="mb-6 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <UserCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">{user?.name || 'Ментор'}</p>
                  <p className="text-sm text-gray-500">Ментор</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6 flex justify-center">
            <UserCircle className="h-10 w-10 text-orange-600" />
          </div>
        )}

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isCollapsed ? 'justify-center' : 'space-x-3'
                } ${
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <LogoutButton collapsed={isCollapsed} />
        </div>
      </div>
    </aside>
  )
}
