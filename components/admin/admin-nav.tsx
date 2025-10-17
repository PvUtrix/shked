
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { useSidebar } from '@/hooks/use-sidebar'
import { LogoutButton } from '@/components/auth/logout-button'
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Settings, 
  GraduationCap,
  UserCircle,
  ClipboardList,
  UserCog,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navItems = [
  {
    label: 'Расписание',
    href: '/admin',
    icon: Calendar
  },
  {
    label: 'Группы',
    href: '/admin/groups',
    icon: Users
  },
  {
    label: 'Предметы',
    href: '/admin/subjects',
    icon: BookOpen
  },
  {
    label: 'Домашние задания',
    href: '/admin/homework',
    icon: ClipboardList
  },
  {
    label: 'Пользователи',
    href: '/admin/users',
    icon: UserCog
  },
  {
    label: 'Настройки',
    href: '/admin/settings',
    icon: Settings
  }
]

interface AdminNavProps {
  user?: {
    name?: string
    email?: string
  }
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname()
  const { isCollapsed, toggle } = useSidebar()

  return (
    <aside className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div className={`p-6 ${isCollapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center mb-8 ${isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <GraduationCap className="h-8 w-8 text-blue-600 flex-shrink-0" />
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
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <UserCircle className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{user?.name || 'Администратор'}</p>
                  <p className="text-sm text-gray-500">Администратор</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-6 flex justify-center">
            <UserCircle className="h-10 w-10 text-blue-600" />
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
                    ? 'bg-blue-100 text-blue-700'
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
