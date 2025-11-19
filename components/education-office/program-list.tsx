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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, BookOpen, Plus } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface Program {
  id: string
  name: string
  degreeType: string
  department: {
    name: string
  }
  requiredCredits: number
  _count: {
    courses: number
  }
}

interface Department {
  id: string
  name: string
}

interface ProgramListProps {
  initialPrograms: Program[]
  departments: Department[]
}

export function ProgramList({ initialPrograms, departments }: ProgramListProps) {
  const [programs, setPrograms] = useState<Program[]>(initialPrograms)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState('')
  const [degreeType, setDegreeType] = useState('Bachelor')
  const [departmentId, setDepartmentId] = useState('')
  const [credits, setCredits] = useState('240')

  const handleCreate = async () => {
    if (!name || !departmentId || !credits) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/education-office/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          degreeType,
          departmentId,
          requiredCredits: parseInt(credits),
        }),
      })

      if (!response.ok) throw new Error('Failed to create program')

      const newProgram = await response.json()
      
      // Optimistic update or refresh
      router.refresh()
      setPrograms([...programs, {
        ...newProgram,
        department: { name: departments.find(d => d.id === departmentId)?.name || '' },
        _count: { courses: 0 }
      }])
      
      setIsCreateOpen(false)
      setName('')
      setDepartmentId('')
      toast({
        title: 'Программа создана',
        description: 'Новая образовательная программа успешно добавлена',
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать программу',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDegreeBadge = (type: string) => {
    switch (type) {
      case 'Bachelor':
        return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Бакалавриат</Badge>
      case 'Master':
        return <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">Магистратура</Badge>
      case 'PhD':
        return <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">Аспирантура</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать программу
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая образовательная программа</DialogTitle>
              <DialogDescription>
                Заполните данные для создания новой учебной программы.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название программы</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Программная инженерия" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Кафедра</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите кафедру" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="degree">Уровень</Label>
                  <Select value={degreeType} onValueChange={setDegreeType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bachelor">Бакалавриат</SelectItem>
                      <SelectItem value="Master">Магистратура</SelectItem>
                      <SelectItem value="PhD">Аспирантура</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="credits">Кредиты (ECTS)</Label>
                  <Input 
                    id="credits" 
                    type="number" 
                    value={credits} 
                    onChange={(e) => setCredits(e.target.value)} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreate} disabled={!name || !departmentId || isSubmitting}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Уровень</TableHead>
              <TableHead>Кафедра</TableHead>
              <TableHead>Курсов</TableHead>
              <TableHead>Кредиты</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Программы не найдены
                </TableCell>
              </TableRow>
            ) : (
              programs.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {program.name}
                    </div>
                  </TableCell>
                  <TableCell>{getDegreeBadge(program.degreeType)}</TableCell>
                  <TableCell>{program.department.name}</TableCell>
                  <TableCell>{program._count.courses}</TableCell>
                  <TableCell>{program.requiredCredits}</TableCell>
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
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Учебный план
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
