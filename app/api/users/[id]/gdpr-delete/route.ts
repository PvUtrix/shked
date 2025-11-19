import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import bcryptjs from 'bcryptjs'
import { randomUUID } from 'crypto'

// POST /api/users/[id]/gdpr-delete - GDPR-совместимое удаление пользователя
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { userName } = body

    if (!userName || typeof userName !== 'string') {
      return NextResponse.json(
        { error: 'Необходимо указать имя пользователя для подтверждения' },
        { status: 400 }
      )
    }

    // Получаем пользователя для проверки
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что введённое имя совпадает с именем пользователя
    const userDisplayName = userToDelete.name || 
                           `${userToDelete.firstName || ''} ${userToDelete.lastName || ''}`.trim() ||
                           userToDelete.email

    if (userName.trim().toLowerCase() !== userDisplayName.toLowerCase()) {
      return NextResponse.json(
        { error: 'Имя пользователя не совпадает. Введите точное имя пользователя для подтверждения удаления.' },
        { status: 400 }
      )
    }

    // Нельзя удалить самого себя
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Нельзя удалить самого себя' },
        { status: 400 }
      )
    }

    // Логирование операции для аудита
    console.log(`[GDPR DELETE] Администратор ${session.user.email} удаляет пользователя ${userToDelete.email} (${userToDelete.id})`)

    // Анонимизация персональных данных пользователя
    const anonymizedEmail = `deleted-${userToDelete.id}@deleted.local`
    const randomPassword = await bcryptjs.hash(randomUUID(), 12)

    await prisma.user.update({
      where: { id: params.id },
      data: {
        email: anonymizedEmail,
        name: null,
        firstName: 'Удалённый',
        lastName: 'Пользователь',
        password: randomPassword,
        image: null,
        canHelp: null,
        lookingFor: null,
        groupId: null,
        mentorGroupIds: Prisma.JsonNull,
        isActive: false,
        // Сохраняем роль для целостности учебных данных
        // Роль остается для связи с учебными записями
      }
    })

    // Удаляем связанные данные, которые не нужны для учебного процесса
    await Promise.all([
      // Аккаунты и сессии
      prisma.account.deleteMany({ where: { userId: params.id } }),
      prisma.session.deleteMany({ where: { userId: params.id } }),
      // Telegram данные
      prisma.telegramUser.deleteMany({ where: { userId: params.id } }),
      // Связи с группами
      prisma.userGroup.deleteMany({ where: { userId: params.id } }),
      // Членство в подгруппах
      prisma.subgroupStudent.deleteMany({ where: { userId: params.id } }),
    ])

    // Анонимизация в учебных данных
    // HomeworkSubmission - заменить имя в контенте (если есть)
    const submissions = await prisma.homeworkSubmission.findMany({
      where: { userId: params.id },
      select: { id: true, content: true }
    })

    for (const submission of submissions) {
      if (submission.content) {
        // Заменяем упоминания имени на "Удалённый пользователь"
        let anonymizedContent = submission.content
        if (userToDelete.name) {
          anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.name, 'gi'), 'Удалённый пользователь')
        }
        if (userToDelete.firstName) {
          anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.firstName, 'gi'), 'Удалённый')
        }
        if (userToDelete.lastName) {
          anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.lastName, 'gi'), 'Пользователь')
        }

        await prisma.homeworkSubmission.update({
          where: { id: submission.id },
          data: { content: anonymizedContent !== submission.content ? anonymizedContent : submission.content }
        })
      }
    }

    // HomeworkComment - анонимизировать имя автора в комментариях
    const comments = await prisma.homeworkComment.findMany({
      where: { authorId: params.id },
      select: { id: true, content: true }
    })

    for (const comment of comments) {
      let anonymizedContent = comment.content
      if (userToDelete.name) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.name, 'gi'), 'Удалённый пользователь')
      }
      if (userToDelete.firstName) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.firstName, 'gi'), 'Удалённый')
      }
      if (userToDelete.lastName) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.lastName, 'gi'), 'Пользователь')
      }

      await prisma.homeworkComment.update({
        where: { id: comment.id },
        data: { content: anonymizedContent !== comment.content ? anonymizedContent : comment.content }
      })
    }

    // ForumTopic и ForumPost - анонимизировать имена авторов
    const topics = await prisma.forumTopic.findMany({
      where: { authorId: params.id },
      select: { id: true, content: true }
    })

    for (const topic of topics) {
      let anonymizedContent = topic.content
      if (userToDelete.name) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.name, 'gi'), 'Удалённый пользователь')
      }
      if (userToDelete.firstName) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.firstName, 'gi'), 'Удалённый')
      }
      if (userToDelete.lastName) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.lastName, 'gi'), 'Пользователь')
      }

      await prisma.forumTopic.update({
        where: { id: topic.id },
        data: { content: anonymizedContent !== topic.content ? anonymizedContent : topic.content }
      })
    }

    const posts = await prisma.forumPost.findMany({
      where: { authorId: params.id },
      select: { id: true, content: true }
    })

    for (const post of posts) {
      let anonymizedContent = post.content
      if (userToDelete.name) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.name, 'gi'), 'Удалённый пользователь')
      }
      if (userToDelete.firstName) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.firstName, 'gi'), 'Удалённый')
      }
      if (userToDelete.lastName) {
        anonymizedContent = anonymizedContent.replace(new RegExp(userToDelete.lastName, 'gi'), 'Пользователь')
      }

      await prisma.forumPost.update({
        where: { id: post.id },
        data: { content: anonymizedContent !== post.content ? anonymizedContent : post.content }
      })
    }

    // Убираем из назначенных преподавателей (SubjectLector)
    await prisma.subjectLector.deleteMany({ where: { userId: params.id } })

    // Документы остаются, но переназначаем uploader на null или системного пользователя
    // Можно оставить как есть, так как email уже анонимизирован

    console.log(`[GDPR DELETE] Пользователь ${userToDelete.email} успешно анонимизирован`)

    return NextResponse.json({ 
      message: 'Персональные данные пользователя успешно удалены. Учебные данные сохранены в анонимизированном виде.' 
    })

  } catch (error) {
    console.error('[GDPR DELETE] Ошибка при удалении пользователя:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

