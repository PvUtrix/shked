'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Settings, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  code: string | null
  head: {
    name: string | null
    email: string
  } | null
  _count: {
    faculty: number
    subjects: number
  }
  isActive: boolean
}

interface DepartmentListProps {
  departments: Department[]
}

export function DepartmentList({ departments }: DepartmentListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Код</TableHead>
            <TableHead>Заведующий</TableHead>
            <TableHead>Состав</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Кафедры не найдены
              </TableCell>
            </TableRow>
          ) : (
            departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell>{dept.code || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {dept.head?.name || 'Не назначен'}
                      </span>
                      {dept.head?.email && (
                        <span className="text-xs text-muted-foreground">
                          {dept.head.email}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {dept._count.faculty} сотрудников, {dept._count.subjects} предметов
                  </div>
                </TableCell>
                <TableCell>
                  {dept.isActive ? (
                    <Badge variant="default" className="bg-green-600">Активна</Badge>
                  ) : (
                    <Badge variant="secondary">Архив</Badge>
                  )}
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
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Настройки
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
  )
}
