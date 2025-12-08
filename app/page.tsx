
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Calendar, Users, BookOpen, Clock, ArrowRight, GraduationCap, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoWithText } from '@/components/ui/logo'
import Link from 'next/link'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session) {
    // Редиректы для всех 8 ролей
     
    switch (session.user.role) {
      case 'admin':
        redirect('/admin')
        break
      case 'lector':
        redirect('/lector')
        break
      case 'assistant':
        redirect('/assistant')
        break
      case 'co_lecturer':
        redirect('/lector') // Со-преподаватели используют тот же интерфейс
        break
      case 'mentor':
        redirect('/mentor')
        break
      case 'education_office_head':
        redirect('/education-office')
        break
      case 'department_admin':
        redirect('/department')
        break
      case 'student':
      default:
        redirect('/student')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <LogoWithText size={32} variant="default" />
            <div className="space-x-4">
              <Button asChild variant="default">
                <Link href="/login">Войти</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center max-w-6xl">
          <div className="fade-in-up">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Управление расписанием
              <span className="block text-blue-600">для МФТИ</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Комплексная система для управления расписанием, домашними заданиями, посещаемостью и учебным процессом
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg">
                <Link href="/login" className="flex items-center">
                  Начать работу
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Роли пользователей
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Система поддерживает 8 типов пользователей с уникальными правами доступа
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Администратор</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Полный доступ к системе, управление пользователями, группами и предметами
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Преподаватель</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Создание ДЗ, проверка работ, отметка посещаемости, управление экзаменами
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Студент</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Просмотр расписания, сдача ДЗ, форум, встречи с ментором, экзамены
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="h-12 w-12 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg text-gray-900">Ментор</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Встречи со студентами, отслеживание прогресса, консультации по ВКР
                </CardDescription>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              + Ассистент, Со-преподаватель, Учебный отдел, Администратор кафедры
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Основные возможности
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Все необходимые инструменты для эффективного управления учебным процессом
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <CardTitle className="text-lg text-gray-900">Календарь расписания</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Удобный календарный вид с возможностью переключения между разными форматами отображения
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <CardTitle className="text-lg text-gray-900">Управление группами</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Создание и редактирование групп студентов, назначение в подгруппы для разных предметов
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <CardTitle className="text-lg text-gray-900">База предметов</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Полная информация о предметах, преподавателях и учебных материалах
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-orange-600" />
                <CardTitle className="text-lg text-gray-900">Гибкое расписание</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Создание сложных расписаний с учетом подгрупп, аудиторий и особых событий
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-pink-600" />
                <CardTitle className="text-lg text-gray-900">Учёт домашних заданий</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  Создание, сдача и проверка домашних заданий с системой оценок и уведомлений
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Версия 0.4.0-alpha
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Расширенные возможности
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Новые инструменты для комплексного управления учебным процессом
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-14 w-14 mb-4 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-gray-900">Отслеживание посещаемости</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  Автоматизированная система учета посещаемости с отчетами и статистикой. Преподаватели отмечают присутствующих, студенты видят свою посещаемость в реальном времени.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-14 w-14 mb-4 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-gray-900">Управление экзаменами</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  Планирование зачетов и экзаменов, внесение результатов, автоматический подсчет оценок. Поддержка различных систем оценивания и экспорт ведомостей.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-14 w-14 mb-4 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-gray-900">Гибкие подгруппы</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  Создание подгрупп для разных предметов и типов занятий. Автоматическое назначение студентов, поддержка пересечений и индивидуальных расписаний.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-14 w-14 mb-4 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="h-7 w-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-gray-900">Форум для обсуждений</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  Тематические обсуждения по предметам, вопросы и ответы, возможность закреплять важные темы. Модерация преподавателями и администраторами.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-14 w-14 mb-4 bg-pink-100 rounded-xl flex items-center justify-center">
                  <svg className="h-7 w-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-gray-900">Встречи с ментором</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  Запись на консультации и встречи с научным руководителем. Календарь встреч, заметки и отслеживание прогресса по ВКР и курсовым работам.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-14 w-14 mb-4 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl text-gray-900">Учебные материалы</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  Хранение РПД, аннотаций и учебных материалов. Ссылки на ЭОР, Zoom-конференции и чаты. Централизованный доступ ко всем ресурсам курса.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="fade-in-up">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2 count-up">
                8
              </div>
              <p className="text-lg text-gray-600">Ролей пользователей</p>
            </div>
            <div className="fade-in-up">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2 count-up">
                10+
              </div>
              <p className="text-lg text-gray-600">Основных функций</p>
            </div>
            <div className="fade-in-up">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2 count-up">
                МФТИ
              </div>
              <p className="text-lg text-gray-600">Разработано для</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Готовы начать?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Присоединяйтесь к Шкед и оптимизируйте управление расписанием уже сегодня
          </p>
          <Button asChild size="lg">
            <Link href="/login" className="flex items-center">
              Войти в систему
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center max-w-6xl">
          <p className="text-gray-600">
            © 2025 Шкед. Система управления университетскими расписаниями.
          </p>
          <p className="text-gray-600 mt-2">
            Сделано с ❤️ в МФТИ
          </p>
          <div className="mt-4">
            <Link
              href="https://github.com/PvUtrix/shked"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Открыть репозиторий проекта на GitHub (откроется в новой вкладке)"
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
              Исходный код на GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
