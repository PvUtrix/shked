# 🎓 SmartSchedule (Шкед)

> Современная веб-платформа для управления расписанием занятий в университете МФТИ

[![Status](https://img.shields.io/badge/status-production_ready-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)]()
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## 📋 О проекте

SmartSchedule (Шкед) — это комплексная система управления учебным процессом, разработанная специально для МФТИ. Платформа предоставляет инструменты для управления расписанием, домашними заданиями, посещаемостью, экзаменами и коммуникацией между всеми участниками образовательного процесса.

### ✨ Ключевые возможности

- 📅 **Управление расписанием** - создание и редактирование расписания занятий
- 📝 **Домашние задания** - система создания, отслеживания и проверки ДЗ
- ✅ **Посещаемость** - автоматизированная система отметки и отчетности
- 🎯 **Экзамены и зачеты** - управление экзаменационной сессией
- 👥 **Подгруппы** - гибкая система разделения студентов
- 💬 **Форум** - обсуждения по предметам с модерацией
- 📚 **Документы и ресурсы** - хранение РПД, ЭОР, Zoom-ссылок
- 🤝 **Встречи с куратором** - система записи и управления встречами
- 🔐 **Система ролей** - 8 типов пользователей с уникальными правами

## 🎭 Роли пользователей

| Роль | Описание | Основные функции |
|------|----------|------------------|
| 👨‍💼 **Admin** | Администратор системы | Полный контроль, управление пользователями |
| 👨‍🏫 **Teacher** | Преподаватель | Управление предметами, ДЗ, экзаменами |
| 🤝 **Assistant** | Ассистент | Помощь преподавателю, проверка работ |
| 👥 **Co-Teacher** | Со-преподаватель | Совместное ведение предмета |
| 🎯 **Mentor** | Куратор/Наставник | Кураторство групп, встречи со студентами |
| 📊 **Education Office Head** | Глава учебного отдела | Управление учебным процессом |
| 🏛️ **Department Admin** | Администратор кафедры | Администрирование кафедры |
| 🎓 **Student** | Студент | Просмотр расписания, форум, встречи |

## 🛠️ Технологический стек

### Frontend
- **Next.js 14** - React фреймворк с App Router
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **Radix UI** - компоненты UI
- **next-themes** - поддержка тем (светлая/темная)

### Backend
- **Next.js API Routes** - serverless API
- **Prisma ORM** - работа с базой данных
- **PostgreSQL** - реляционная БД
- **NextAuth.js** - аутентификация

### Infrastructure
- **Vercel** - хостинг (рекомендуется)
- **Neon/Supabase** - PostgreSQL хостинг
- **Uploadthing/S3** - хранение файлов

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- PostgreSQL 14+
- npm или yarn

### Установка

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/your-org/smartschedule.git
cd smartschedule
```

2. **Установите зависимости**
```bash
npm install
```

3. **Настройте переменные окружения**
```bash
cp .env.example .env
```

Заполните `.env`:
```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/smartschedule"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Telegram (опционально)
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_WEBHOOK_URL="https://your-domain.com/api/telegram/webhook"
```

4. **Настройте базу данных**
```bash
# Создайте миграции
npx prisma migrate dev

# Наполните БД начальными данными
npx prisma db seed
```

5. **Запустите dev сервер**
```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## 📁 Структура проекта

```
smartschedule/
├── app/                    # Next.js App Router
│   ├── admin/             # Страницы админа
│   ├── teacher/           # Страницы преподавателя
│   ├── student/           # Страницы студента
│   ├── mentor/            # Страницы ментора
│   └── api/               # API routes
├── components/            # React компоненты
│   ├── ui/               # Общие UI компоненты
│   ├── admin/            # Компоненты админа
│   ├── teacher/          # Компоненты преподавателя
│   ├── student/          # Компоненты студента
│   └── mentor/           # Компоненты ментора
├── lib/                   # Утилиты и конфигурация
│   ├── auth.ts           # NextAuth конфигурация
│   ├── prisma.ts         # Prisma клиент
│   └── types.ts          # TypeScript типы
├── prisma/               # Prisma схема и миграции
│   ├── schema.prisma     # Схема БД
│   └── migrations/       # Миграции
├── docs/                 # Документация
└── public/               # Статические файлы
```

## 📚 Документация

### Основная документация
- [Гайд по развертыванию](./DEPLOYMENT_GUIDE.md)
- [Чек-лист деплоя](./DEPLOYMENT_CHECKLIST.md)
- [История изменений](./CHANGELOG.md)
- [Индекс документации](./DOCUMENTATION_INDEX.md)

### Техническая документация
- [API Reference](./docs/API.md)
- [Роли пользователей](./docs/features/USER_ROLES.md)
- [Система подгрупп](./docs/features/SUBGROUPS_SYSTEM.md)
- [Отслеживание посещаемости](./docs/features/ATTENDANCE_TRACKING.md)
- [Управление экзаменами](./docs/features/EXAM_MANAGEMENT.md)
- [Встречи с ментором](./docs/features/MENTOR_MEETINGS.md)
- [Система форума](./docs/features/FORUM_SYSTEM.md)
- [Документы и ресурсы](./docs/features/DOCUMENTS_RESOURCES.md)

## 🔐 Безопасность

- Все API endpoints защищены middleware
- Роль-ориентированный контроль доступа (RBAC)
- JWT токены для аутентификации
- Валидация данных на всех уровнях
- SQL injection защита через Prisma
- XSS защита через React

## 🧪 Тестирование

```bash
# Unit тесты
npm run test

# Integration тесты
npm run test:integration

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:coverage
```

## 📦 Деплой

### Vercel (рекомендуется)

1. Подключите GitHub репозиторий к Vercel
2. Настройте переменные окружения
3. Vercel автоматически развернет приложение

### Docker

```bash
# Сборка образа
docker build -t smartschedule .

# Запуск контейнера
docker run -p 3000:3000 smartschedule
```

### Manual

```bash
# Сборка production
npm run build

# Запуск production
npm start
```

Подробнее в [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

## 🤝 Участие в разработке

Мы приветствуем вклад в развитие проекта!

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 👥 Команда

**Разработчик**: Pavel Shershnev (Павел Шершнёв)  
**Компания**: Tango.Vision  
**Заказчик**: МФТИ (Московский физико-технический институт)

## 📞 Контакты

- **Email**: [email protected]
- **Telegram**: @username
- **Website**: https://smartschedule.mfti.ru

## 🙏 Благодарности

- МФТИ за доверие и возможность создать этот проект
- Всем преподавателям и студентам за обратную связь
- Open source сообществу за отличные инструменты

---

**Статус проекта**: ✅ Production Ready (v1.0.0)  
**Последнее обновление**: 30 октября 2025

Made with ❤️ for МФТИ
