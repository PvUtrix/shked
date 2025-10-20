# 📚 Документация SmartSchedule

Добро пожаловать в документацию проекта SmartSchedule (Шкед) — современной платформы для управления расписанием занятий в университете МФТИ.

## 📖 Корневые файлы проекта

Следующие файлы находятся в корне проекта согласно стандартам GitHub:

- [**README.md**](../readme.md) — Главная документация проекта
- [**LICENSE**](../LICENSE) — Лицензия MIT
- [**CHANGELOG.md**](../CHANGELOG.md) — История изменений проекта

## 🗂️ Структура документации

### 🚀 Быстрый старт (`getting-started/`)

Документы для быстрого начала работы с проектом:

- [**QUICK_DEPLOY.md**](getting-started/QUICK_DEPLOY.md) — Быстрое развертывание на сервере
- [**QUICK_MIGRATE.md**](getting-started/QUICK_MIGRATE.md) — Быстрая миграция для inline комментариев

### 👨‍💻 Разработка (`development/`)

Руководства для разработчиков проекта:

- [**CONTRIBUTING.md**](development/CONTRIBUTING.md) — Руководство для контрибьюторов
- [**CODE_OF_CONDUCT.md**](development/CODE_OF_CONDUCT.md) — Кодекс поведения сообщества
- [**TESTING.md**](development/TESTING.md) — Руководство по тестированию
- [**STRUCTURE.md**](development/STRUCTURE.md) — Структура проекта

### 🚢 Развертывание (`deployment/`)

Инструкции по развертыванию приложения:

- [**DEPLOYMENT.md**](deployment/DEPLOYMENT.md) — Полное руководство по развертыванию
- [**DOCKER_DEPLOY.md**](deployment/DOCKER_DEPLOY.md) — Развертывание через Docker

### ⚡ Функциональность (`features/`)

Описание основных возможностей системы:

- [**USER_ROLES.md**](features/USER_ROLES.md) — Роли пользователей и права доступа
- [**SUBGROUPS.md**](features/SUBGROUPS.md) — Система управления подгруппами
- [**TELEGRAM_BOT.md**](features/TELEGRAM_BOT.md) — Интеграция с Telegram
- [**MDX_EDITOR_INTEGRATION.md**](features/MDX_EDITOR_INTEGRATION.md) — Rich text редактор для заданий

### 🏷️ Релизы и версионирование (`releases/`)

Документы о управлении версиями и релизами:

- [**VERSIONING.md**](releases/VERSIONING.md) — Система версионирования проекта
- [**RELEASE_GUIDE.md**](releases/RELEASE_GUIDE.md) — Руководство по созданию релизов
- [**GITHUB_RELEASES.md**](releases/GITHUB_RELEASES.md) — Автоматизация GitHub релизов

### 📄 Мета информация (`meta/`)

Общая информация о проекте:

- [**AUTHOR.md**](meta/AUTHOR.md) — Информация об авторе
- [**SECURITY.md**](meta/SECURITY.md) — Политика безопасности
- [**FUNDING.md**](meta/FUNDING.md) — Информация о финансировании

## 💡 Как использовать документацию

### Для новичков
1. Начните с [главного README](../readme.md)
2. Изучите [роли пользователей](features/USER_ROLES.md)
3. Следуйте [руководству по быстрому развертыванию](getting-started/QUICK_DEPLOY.md)

### Для разработчиков
1. Прочитайте [руководство для контрибьюторов](development/CONTRIBUTING.md)
2. Изучите [кодекс поведения](development/CODE_OF_CONDUCT.md)
3. Ознакомьтесь с [руководством по тестированию](development/TESTING.md)
4. Изучите [структуру проекта](development/STRUCTURE.md)

### Для DevOps
1. Ознакомьтесь с [полным руководством по развертыванию](deployment/DEPLOYMENT.md)
2. Используйте [Docker инструкцию](deployment/DOCKER_DEPLOY.md)
3. Настройте [систему версионирования](releases/VERSIONING.md)

### Для менеджеров проекта
1. Изучите [систему релизов](releases/GITHUB_RELEASES.md)
2. Отслеживайте изменения в [CHANGELOG](../CHANGELOG.md)
3. Понимайте [роли и права доступа](features/USER_ROLES.md)

## 🔄 Обновление документации

При внесении изменений в проект обязательно обновляйте соответствующую документацию:

- ✅ **CHANGELOG.md** — при каждом значимом изменении
- ✅ **USER_ROLES.md** — при изменении ролевой модели
- ✅ **Технические документы** — при архитектурных изменениях
- ✅ **README.md** — при добавлении новых функций

## 📝 Формат коммитов

Проект использует [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Примеры правильных коммитов
feat(admin): добавить CRUD для групп
fix(api): исправить валидацию email
docs(readme): обновить установку
```

Подробнее см. в [руководстве по релизам](releases/RELEASE_GUIDE.md).

## 🛠️ Технологический стек

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Next.js API Routes, Prisma ORM
- **База данных:** PostgreSQL
- **Аутентификация:** NextAuth.js
- **Интеграции:** Telegram Bot API, OpenAI API
- **DevOps:** Docker, GitHub Actions

## 📊 Статистика проекта

- **Документов:** 20+ файлов
- **Категорий:** 6 основных разделов
- **Языки:** Русский (документация), TypeScript/JavaScript (код)
- **Лицензия:** MIT

## 🤝 Вклад в проект

Мы приветствуем вклад в проект! Пожалуйста:

1. Прочитайте [CONTRIBUTING.md](development/CONTRIBUTING.md)
2. Следуйте [CODE_OF_CONDUCT.md](development/CODE_OF_CONDUCT.md)
3. Создавайте понятные Pull Request'ы
4. Пишите тесты для нового функционала

## 🔒 Безопасность

Если вы обнаружили уязвимость безопасности, пожалуйста, следуйте инструкциям в [SECURITY.md](meta/SECURITY.md).

## 📧 Контакты

- **Автор:** Павел Викторович Шершнёв
- **Проект:** SmartSchedule (Шкед)
- **Репозиторий:** [GitHub](https://github.com/PvUtrix/shked)

## 📅 История обновлений

- **v1.1.0** (2025-10-20) — Реструктуризация документации
- **v1.0.0** (2024-10-16) — Первый официальный релиз

---

**Версия документации:** 2.0.0  
**Последнее обновление:** 20 октября 2025  
**Статус:** ✅ Актуальная
