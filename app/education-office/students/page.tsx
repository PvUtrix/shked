'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Users, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { getFullName } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  middleName?: string | null
  birthday?: string | null
  snils?: string | null
  sex?: string | null
  role: string
  groupId: string | null
  createdAt: string
  isActive?: boolean
  group?: {
    id: string
    name: string
  }
}

interface Group {
  id: string
  name: string
}

export default function EducationOfficeStudentsPage() {
  const t = useTranslations('educationOffice.students')
  const locale = useLocale()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')

  const fetchUsers = useCallback(async () => {
    try {
      // Force role=student for this page
      const response = await fetch('/api/users?role=student')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        toast.error(t('loadFailed'))
      }
    } catch (error) {
      console.error('Loading students failed:', error)
      toast.error(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchGroups()
    fetchUsers()
  }, [fetchUsers])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Loading groups failed:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.middleName && user.middleName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Check if group filter matches specifically or if 'all' is selected
    const matchesGroup = groupFilter === 'all' || user.groupId === groupFilter
    
    return matchesSearch && matchesGroup
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-sm text-gray-600">
              {t('counts', { total: users.length, shown: filteredUsers.length })}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-64">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('group')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allGroups')}</SelectItem>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{t('empty')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('groupColumn')}</TableHead>
                  <TableHead>{t('sex')}</TableHead>
                  <TableHead>{t('birthday')}</TableHead>
                  <TableHead>{t('registered')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <span className="font-medium">
                        {getFullName(user) || t('noName')}
                      </span>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.group ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200">
                          {user.group.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.sex === 'male' ? t('male') : user.sex === 'female' ? t('female') : '—'}
                    </TableCell>
                    <TableCell>
                      {user.birthday ? new Date(user.birthday).toLocaleDateString(locale) : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString(locale)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
