import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getNotificationStats } from '@/lib/telegram/notifications'
import { prisma } from '@/lib/db'

// Указываем, что этот route должен быть динамическим
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем статистику уведомлений
    const notificationStats = await getNotificationStats()

    // Получаем статистику по группам
    const groupStats = await prisma.group.findMany({
      include: {
        _count: {
          select: {
            users: true,
            schedules: true
          }
        },
        users: {
          include: {
            telegramUser: true
          }
        }
      }
    })

    // Получаем последние подключения
    const recentConnections = await prisma.telegramUser.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            group: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Статистика по ролям
    const roleStats = await prisma.telegramUser.groupBy({
      by: ['userId'],
      where: {
        isActive: true
      },
      _count: {
        userId: true
      }
    })

    const roleStatsWithDetails = await Promise.all(
      roleStats.map(async (stat) => {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { role: true }
        })
        return {
          role: user?.role || 'unknown',
          count: stat._count.userId
        }
      })
    )

    // Общая статистика системы
    const systemStats = await Promise.all([
      prisma.user.count(),
      prisma.group.count(),
      prisma.schedule.count(),
      prisma.subject.count(),
      prisma.telegramUser.count({ where: { isActive: true } }),
      prisma.telegramUser.count({ where: { notifications: true } })
    ])

    const [totalUsers, totalGroups, totalSchedules, totalSubjects, activeTelegramUsers, notificationsEnabled] = systemStats

    return NextResponse.json({
      notificationStats,
      groupStats: groupStats.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        studentCount: group._count.users,
        scheduleCount: group._count.schedules,
        telegramConnected: group.users.filter(u => u.telegramUser?.isActive).length,
        telegramPercentage: group._count.users > 0 
          ? Math.round((group.users.filter(u => u.telegramUser?.isActive).length / group._count.users) * 100)
          : 0
      })),
      recentConnections: recentConnections.map(conn => ({
        id: conn.id,
        telegramId: conn.telegramId,
        username: conn.username,
        firstName: conn.firstName,
        lastName: conn.lastName,
        user: {
          firstName: conn.user.firstName,
          lastName: conn.user.lastName,
          email: conn.user.email,
          group: conn.user.group?.name
        },
        createdAt: conn.createdAt,
        isActive: conn.isActive,
        notifications: conn.notifications
      })),
      roleStats: roleStatsWithDetails,
      systemStats: {
        totalUsers,
        totalGroups,
        totalSchedules,
        totalSubjects,
        activeTelegramUsers,
        notificationsEnabled,
        telegramConnectionRate: totalUsers > 0 
          ? Math.round((activeTelegramUsers / totalUsers) * 100)
          : 0
      }
    })
  } catch (error) {
    console.error('Ошибка при получении статистики:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
