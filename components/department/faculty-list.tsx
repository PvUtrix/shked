'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Search, UserPlus, Mail, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface FacultyMember {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  _count: {
    lectorSubjects: number
    assistantSubjects: number
  }
}

interface FacultyListProps {
  initialFaculty: FacultyMember[]
  departmentId: string
}

export function FacultyList({ initialFaculty, departmentId }: FacultyListProps) {
  const [faculty, setFaculty] = useState<FacultyMember[]>(initialFaculty)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const filteredFaculty = faculty.filter((member) =>
    (member.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRemoveFaculty = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите исключить этого сотрудника из кафедры?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/department/faculty/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove faculty')
      }

      setFaculty(faculty.filter((f) => f.id !== userId))
      toast({
        title: 'Сотрудник исключен',
        description: 'Пользователь успешно удален из состава кафедры',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось исключить сотрудника',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'lector':
        return <Badge variant="default">Лектор</Badge>
      case 'co_lecturer':
        return <Badge variant="secondary">Со-лектор</Badge>
      case 'assistant':
        return <Badge variant="outline">Ассистент</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск сотрудника..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        {/* Add Faculty Button will be handled by a separate component/modal wrapping this or alongside */}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сотрудник</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Нагрузка</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFaculty.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Сотрудники не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredFaculty.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.image || undefined} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name || 'Без имени'}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Предметов:</span>
                        <span>{member._count.lectorSubjects + member._count.assistantSubjects}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Меню</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Действия</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(member.email)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Копировать Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleRemoveFaculty(member.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Исключить из кафедры
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
