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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, BookOpen, User, MoreHorizontal, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface Subject {
  id: string
  name: string
  description: string | null
  isActive: boolean
  lectors: Array<{
    lector: {
      id: string
      name: string | null
    }
    role: string
  }>
  _count: {
    schedules: number
    documents: number
  }
}

interface FacultyMember {
  id: string
  name: string | null
}

interface SubjectManagementProps {
  initialSubjects: Subject[]
  faculty: FacultyMember[]
}

export function SubjectManagement({ initialSubjects, faculty }: SubjectManagementProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedCoordinator, setSelectedCoordinator] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAssignCoordinator = async () => {
    if (!selectedSubject || !selectedCoordinator) return

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/department/subjects/${selectedSubject.id}/coordinator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedCoordinator }),
      })

      if (!response.ok) {
        throw new Error('Failed to assign coordinator')
      }

      toast({
        title: 'Координатор назначен',
        description: 'Преподаватель успешно назначен координатором предмета',
      })
      
      setSelectedSubject(null)
      setSelectedCoordinator('')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось назначить координатора',
        variant: 'destructive',
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const getCoordinator = (subject: Subject) => {
    const coordinator = subject.lectors.find(l => l.role === 'LECTOR')
    return coordinator?.lector.name || 'Не назначен'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск предмета..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button>
          <BookOpen className="mr-2 h-4 w-4" />
          Добавить предмет
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Предмет</TableHead>
              <TableHead>Координатор</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Активность</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Предметы не найдены
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <div className="font-medium">{subject.name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {subject.description || 'Нет описания'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{getCoordinator(subject)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {subject.isActive ? (
                      <Badge variant="default" className="bg-green-600">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Архив</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {subject._count.schedules} занятий, {subject._count.documents} материалов
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
                        <DropdownMenuItem onClick={() => setSelectedSubject(subject)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Назначить координатора
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

      <Dialog open={!!selectedSubject} onOpenChange={(open) => !open && setSelectedSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначение координатора</DialogTitle>
            <DialogDescription>
              Выберите преподавателя, который будет отвечать за предмет "{selectedSubject?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedCoordinator} onValueChange={setSelectedCoordinator}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите преподавателя" />
              </SelectTrigger>
              <SelectContent>
                {faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name || 'Без имени'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubject(null)}>
              Отмена
            </Button>
            <Button onClick={handleAssignCoordinator} disabled={!selectedCoordinator || isAssigning}>
              Назначить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
