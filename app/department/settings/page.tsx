import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

export default async function DepartmentSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'department_admin') {
    redirect('/login')
  }

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: {
        include: {
          settings: true
        }
      }
    }
  })

  const department = user?.department

  if (!department) {
    return <div>Department not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Настройки кафедры</h1>
        <p className="text-muted-foreground mt-2">
          Управление информацией и параметрами кафедры
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>
              Общие сведения о кафедре, видимые пользователям
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название кафедры</Label>
              <Input id="name" defaultValue={department.name} disabled />
              <p className="text-xs text-muted-foreground">
                Для изменения названия обратитесь к администратору системы
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="code">Код кафедры</Label>
              <Input id="code" defaultValue={department.code || ''} placeholder="Например: ИВТ" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea 
                id="description" 
                defaultValue={department.description || ''} 
                placeholder="Краткое описание деятельности кафедры..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Контактная информация</CardTitle>
            <CardDescription>
              Контакты для связи со студентами и сотрудниками
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email кафедры</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={department.settings?.contactEmail || ''} 
                  placeholder="dept@university.com" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input 
                  id="phone" 
                  defaultValue={department.settings?.contactPhone || ''} 
                  placeholder="+7 (999) 000-00-00" 
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="office">Аудитория / Офис</Label>
              <Input 
                id="office" 
                defaultValue={department.settings?.office || ''} 
                placeholder="Корпус 1, каб. 305" 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Сохранить изменения</Button>
        </div>
      </div>
    </div>
  )
}
