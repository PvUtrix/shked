# 🚀 Руководство по релизам и версионированию

## 🎯 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Создание коммита
```bash
git add .
git commit -m "feat(admin): добавить новую функцию"
```

### 3. Создание релиза
```bash
# Patch версия (1.0.0 -> 1.0.1)
npm run release:patch

# Minor версия (1.0.0 -> 1.1.0) 
npm run release:minor

# Major версия (1.0.0 -> 2.0.0)
npm run release:major

# Beta версия (1.0.0 -> 1.1.0-beta.0)
npm run release:beta
```

## 📋 Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run release` | Интерактивный выбор версии |
| `npm run release:patch` | Patch версия (исправления) |
| `npm run release:minor` | Minor версия (новые функции) |
| `npm run release:major` | Major версия (breaking changes) |
| `npm run release:beta` | Beta версия (тестирование) |
| `npm run changelog` | Создать changelog вручную |

## 🔄 Рабочий процесс

### Ежедневная разработка
```bash
# 1. Создайте ветку
git checkout -b feat/new-feature

# 2. Разработайте функцию
git add .
git commit -m "feat(admin): добавить CRUD для групп"

# 3. Продолжайте разработку
git commit -m "fix(ui): исправить валидацию"
git commit -m "test(admin): добавить тесты"

# 4. Создайте PR и смержите в main
```

### Создание релиза
```bash
# 1. Переключитесь на main
git checkout main
git pull origin main

# 2. Создайте релиз
npm run release:minor

# 3. Отправьте изменения
git push origin main --tags
```

## 📝 Формат коммитов

### Структура
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Типы коммитов

| Тип | Описание | Версия |
|-----|----------|--------|
| `feat` | Новая функциональность | MINOR |
| `fix` | Исправление ошибки | PATCH |
| `perf` | Улучшение производительности | PATCH |
| `refactor` | Рефакторинг кода | PATCH |
| `docs` | Документация | PATCH |
| `style` | Форматирование | PATCH |
| `test` | Тесты | PATCH |
| `chore` | Обслуживание | PATCH |
| `ci` | CI/CD | PATCH |
| `build` | Сборка | PATCH |

### Области (scope)

- `admin` - административная панель
- `student` - студенческий интерфейс  
- `lector` - интерфейс преподавателя
- `mentor` - интерфейс ментора
- `api` - API endpoints
- `ui` - пользовательский интерфейс
- `db` - база данных
- `auth` - аутентификация
- `homework` - домашние задания
- `schedule` - расписание
- `groups` - группы
- `users` - пользователи
- `subjects` - предметы
- `telegram` - Telegram интеграция

### Примеры

```bash
# ✅ Хорошие коммиты
feat(admin): добавить CRUD для групп
fix(api): исправить валидацию email
docs: обновить README
refactor(ui): вынести общие компоненты
test(admin): добавить тесты для GroupForm

# ❌ Плохие коммиты
fix: исправить баг
update: обновить код
changes: изменения
```

## 🏷️ Типы релизов

### Patch (1.0.0 -> 1.0.1)
- Исправления ошибок
- Улучшения производительности
- Обновления документации
- Рефакторинг без изменения API

```bash
npm run release:patch
```

### Minor (1.0.0 -> 1.1.0)
- Новые функции
- Новые API endpoints
- Обратно совместимые изменения

```bash
npm run release:minor
```

### Major (1.0.0 -> 2.0.0)
- Breaking changes
- Удаление устаревших функций
- Изменения в API

```bash
npm run release:major
```

### Beta (1.0.0 -> 1.1.0-beta.0)
- Тестовые версии
- Экспериментальные функции

```bash
npm run release:beta
```

## 🔧 Настройка

### Автоматические проверки
- **Commitlint** - проверяет формат коммитов
- **Husky** - git hooks для автоматизации
- **Release-it** - создание релизов

### Конфигурация
- `commitlint.config.js` - правила для коммитов
- `.release-it.json` - настройки релизов
- `CHANGELOG.md` - автоматически обновляется

## 📊 Что происходит при релизе

1. **Анализ коммитов** - определяет тип изменения
2. **Обновление версии** - в `package.json` и `package-lock.json`
3. **Генерация changelog** - на основе коммитов
4. **Создание тега** - git tag с версией
5. **Коммит изменений** - версия и changelog
6. **GitHub Release** - автоматическое создание (если настроено)

## 🎯 Лучшие практики

### Коммиты
1. **Делайте коммиты часто** - каждый логический блок
2. **Используйте понятные сообщения** - что и зачем
3. **Группируйте изменения** - один коммит = одна задача
4. **Тестируйте перед коммитом** - не ломайте main

### Релизы
1. **Тестируйте перед релизом** - убедитесь что все работает
2. **Создавайте релизы регулярно** - не накапливайте изменения
3. **Документируйте breaking changes** - в footer коммита
4. **Используйте beta для тестирования** - перед major релизом

### Версионирование
1. **Следуйте SemVer** - MAJOR.MINOR.PATCH
2. **Документируйте изменения** - в changelog
3. **Тегируйте релизы** - для отслеживания версий
4. **Создавайте release notes** - для пользователей

## 🚨 Важные моменты

- Все коммиты проверяются автоматически
- Неправильный формат коммита приведет к ошибке
- Changelog генерируется автоматически
- Версии создаются только на основе коммитов
- Breaking changes требуют специального формата

## 🔍 Отладка

### Проблемы с коммитами
```bash
# Проверить формат коммита
npx commitlint --from HEAD~1 --to HEAD --verbose

# Исправить последний коммит
git commit --amend -m "feat(admin): правильное сообщение"
```

### Проблемы с релизами
```bash
# Проверить статус
git status

# Отменить последний релиз
git tag -d v1.1.0
git reset --hard HEAD~1
```

## 📚 Дополнительные ресурсы

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Release-it Documentation](https://github.com/release-it/release-it)
- [Keep a Changelog](https://keepachangelog.com/)
