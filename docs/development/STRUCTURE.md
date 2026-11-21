# 📁 Структура документации проекта

Этот документ описывает организацию документации в проекте **Шкед** согласно рекомендациям GitHub.

## 📋 Файлы в корне проекта

Согласно [GitHub best practices](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories), в корне должны находиться:

### ✅ Обязательные файлы:
- **`readme.md`** - Главная документация проекта
- **`LICENSE`** - Лицензия проекта (MIT)
- **`CHANGELOG.md`** - История изменений проекта

### ✅ Рекомендуемые файлы (в корне):
- **`.gitignore`** - Игнорируемые файлы
- **`.env.example`** - Пример переменных окружения
- **`package.json`** - Зависимости Node.js
- **`tsconfig.json`** - Конфигурация TypeScript
- **`docker-compose.yml`** - Конфигурация Docker

## 📚 Файлы в папке `/docs`

GitHub **автоматически находит** следующие community health files в папке `/docs`:

### 🤝 Community файлы:
- **`CONTRIBUTING.md`** - Руководство для контрибьюторов
- **`CODE_OF_CONDUCT.md`** - Кодекс поведения
- **`SECURITY.md`** - Политика безопасности

### 📖 Техническая документация:
- **`DEPLOYMENT.md`** - Руководство по развертыванию
- **`TESTING.md`** - Руководство по тестированию
- **`VERSIONING.md`** - Система версионирования
- **`RELEASE_GUIDE.md`** - Руководство по релизам

### 🎯 Специфичная документация:
- **`USER_ROLES.md`** - Описание ролей пользователей
- **`TELEGRAM_BOT.md`** - Документация Telegram бота
- **`SUBGROUPS.md`** - Система подгрупп
- **`MDX_EDITOR_INTEGRATION.md`** - Интеграция MDX редактора

### 🚀 Quick guides:
- **`QUICK_DEPLOY.md`** - Быстрое развертывание
- **`DOCKER_DEPLOY.md`** - Деплой через Docker

### 📝 Дополнительные файлы:
- **`README.md`** - Индекс документации
- **`AUTHOR.md`** - Информация об авторе
- **`FUNDING.md`** - Информация о поддержке проекта
- **`GITHUB_RELEASES.md`** - GitHub релизы

## 🎯 Преимущества такой структуры

### ✨ Чистота корня:
- В корне только самые важные файлы
- Легко найти основную информацию
- Профессиональный вид проекта

### 📚 Организованная документация:
- Вся детальная документация в `/docs`
- Логическая группировка по темам
- Удобная навигация через `docs/README.md`

### 🤖 GitHub интеграция:
- GitHub автоматически распознает файлы в `/docs`
- Отображает ссылки на community files
- Поддерживает шаблоны в `.github/`

## 🔍 Как GitHub находит файлы

GitHub ищет community health files в следующем порядке:
1. Корень репозитория (`/`)
2. Папка `.github/`
3. Папка `docs/`

**Важно:** Если файл найден в нескольких местах, GitHub использует первый найденный (приоритет у корня).

## 📖 Ссылки

- [GitHub Repository Best Practices](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories)
- [About community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file)

---

**Последнее обновление:** 20 октября 2025  
**Версия:** 1.0.0

