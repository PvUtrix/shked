'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { LogoutButton } from '@/components/auth/logout-button'
import { useSidebar } from '@/hooks/use-sidebar'
import { 
  Users, 
  Calendar, 
  User, 
  ClipboardList,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'

interface MentorNavProps {
  user?: {
    name?: string
    email?: string
  }
}

export function MentorNav({ user }: MentorNavProps) {
  const pathname = usePathname()
  const { isCollapsed, toggle, mounted } = useSidebar()
  const t = useTranslations()

  const navItems = [
    {
      label: t('mentor.nav.groups'),
      href: '/mentor',
      icon: Users
    },
    {
      label: t('mentor.nav.schedule'),
      href: '/mentor/schedule',
      icon: Calendar
    },
    {
      label: t('mentor.nav.students'),
      href: '/mentor/students',
      icon: User
    },
    {
      label: t('mentor.nav.homework'),
      href: '/mentor/homework',
      icon: ClipboardList
    },
    {
      label: t('mentor.nav.profile'),
      href: '/mentor/profile',
      icon: User
    }
  ]

  return (
    <aside 
      className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${
        mounted && isCollapsed ? 'w-20' : 'w-64'
      }`}
      suppressHydrationWarning
    >
      <div className={`p-6 ${mounted && isCollapsed ? 'px-3' : ''}`} suppressHydrationWarning>
        <div className={`flex items-center mb-8 ${mounted && isCollapsed ? 'justify-center' : 'space-x-2'}`}>
          <Logo size={32} variant="default" />
          {(!mounted || !isCollapsed) && <h1 className="text-xl font-bold text-gray-900">{t('common.appName')}</h1>}
        </div>
        
        {/* Кнопка сворачивания */}
        <button
          onClick={toggle}
          className="w-full mb-6 p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          aria-label={mounted && isCollapsed ? t('admin.nav.expandSidebar') : t('admin.nav.collapseSidebar')}
          suppressHydrationWarning
        >
          {mounted && isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 text-gray-600 mr-2" />
              <span className="text-sm text-gray-600">{t('admin.nav.collapse')}</span>
            </>
          )}
        </button>

        {/* Карточка пользователя */}
        {!mounted || !isCollapsed ? (
          <Card className="mb-6 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <UserCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">{user?.name || t('mentor.defaultName')}</p>
                  <p className="text-sm text-gray-500">{t('mentor.role')}</p>
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
                  mounted && isCollapsed ? 'justify-center' : 'space-x-3'
                } ${
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={mounted && isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {(!mounted || !isCollapsed) && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <LogoutButton collapsed={mounted ? isCollapsed : false} />
        </div>
      </div>
    </aside>
  )
}
