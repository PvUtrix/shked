import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SubgroupForm } from '@/components/admin/subgroup-form'
import { Users, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function AdminSubgroupsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    redirect('/login')
  }

  // Получаем все группы
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Получаем все предметы
  const subjects = await prisma.subject.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Получаем все подгруппы
  const subgroups = await prisma.subgroup.findMany({
    include: {
      group: {
        select: {
          name: true,
        },
      },
      subject: {
        select: {
          name: true,
        },
      },
      students: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Группируем по группам
  const subgroupsByGroup = groups.map(group => ({
    group,
    subgroups: subgroups.filter(s => s.groupId === group.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление подгруппами</h1>
          <p className="text-muted-foreground mt-2">
            Создание и управление гибкими подгруппами студентов
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/groups">
            К группам
          </Link>
        </Button>
      </div>

      {/* Форма создания */}
      <Card>
        <CardHeader>
          <CardTitle>Создать новую подгруппу</CardTitle>
          <CardDescription>
            Подгруппы могут быть привязаны к предмету или быть общими
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubgroupForm groups={groups} subjects={subjects} />
        </CardContent>
      </Card>

      {/* Список подгрупп по группам */}
      <div className="space-y-6">
        {subgroupsByGroup.map(({ group, subgroups: groupSubgroups }) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>
                Подгрупп: {groupSubgroups.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groupSubgroups.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Подгруппы не созданы
                </p>
              ) : (
                <div className="space-y-4">
                  {groupSubgroups.map((subgroup) => (
                    <div
                      key={subgroup.id}
                      className="border rounded-lg p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{subgroup.name}</h3>
                            {subgroup.subject && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                <BookOpen className="inline h-3 w-3 mr-1" />
                                {subgroup.subject.name}
                              </span>
                            )}
                          </div>
                          {subgroup.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {subgroup.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{subgroup.students.length} студентов</span>
                            {subgroup.number && (
                              <span>• Номер: {subgroup.number}</span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/groups/${group.id}/subgroups/${subgroup.id}`}>
                            Управление
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}


