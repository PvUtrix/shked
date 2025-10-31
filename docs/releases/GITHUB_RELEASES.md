# 🚀 GitHub Releases и Версионирование

## 📋 Обзор

Проект **Шкед** использует автоматизированную систему управления версиями и релизами через GitHub Actions.

## 🎯 Основные возможности

### ✅ Реализовано

1. **Автоматическое версионирование** - версии генерируются на основе Conventional Commits
2. **Отображение версии в футере** - на всех страницах приложения
3. **GitHub Actions workflows** - для автоматического и ручного создания релизов
4. **Changelog генерация** - автоматическое создание списка изменений
5. **Semantic Versioning** - следование стандарту SemVer (MAJOR.MINOR.PATCH)

## 📦 Текущая версия

Текущая версия проекта: **v1.1.0**

Версия отображается в футере всех страниц приложения и ссылается на соответствующий релиз на GitHub.

## 🔄 Типы релизов

### Patch (1.0.0 → 1.0.1)
Используется для:
- Исправления ошибок
- Улучшения производительности
- Обновления документации
- Мелкие изменения без влияния на API

**Команда:**
```bash
npm run release:patch
```

### Minor (1.0.0 → 1.1.0)
Используется для:
- Новых функций
- Новых API endpoints
- Обратно совместимых изменений

**Команда:**
```bash
npm run release:minor
```

### Major (1.0.0 → 2.0.0)
Используется для:
- Breaking changes
- Удаления устаревших функций
- Несовместимых изменений в API

**Команда:**
```bash
npm run release:major
```

### Beta (1.0.0 → 1.1.0-beta.0)
Используется для:
- Тестовых версий
- Экспериментальных функций
- Предварительных релизов

**Команда:**
```bash
npm run release:beta
```

## 🤖 GitHub Actions Workflows

### 1. Автоматический релиз (`release.yml`)

Запускается автоматически при пуше в ветку `main`.

**Что делает:**
1. Анализирует коммиты с последнего релиза
2. Определяет тип релиза (patch/minor/major)
3. Обновляет версию в package.json
4. Генерирует changelog
5. Создает git tag
6. Создает GitHub Release

**Триггеры:**
- Push в ветку `main` (кроме изменений в документации)
- Ручной запуск через GitHub UI

### 2. Ручной релиз (`manual-release.yml`)

Позволяет вручную создать релиз любого типа через интерфейс GitHub.

**Как использовать:**
1. Перейдите в Actions на GitHub
2. Выберите "Manual Release"
3. Нажмите "Run workflow"
4. Выберите тип релиза (patch/minor/major/beta)
5. Нажмите "Run workflow"

## 📝 Формат коммитов

Проект использует [Conventional Commits](https://www.conventionalcommits.org/).

### Структура
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Типы

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
| `BREAKING CHANGE` | Несовместимые изменения | MAJOR |

### Примеры

```bash
# ✅ Хорошие коммиты
feat(admin): добавить CRUD для групп
fix(api): исправить валидацию email
docs: обновить README с информацией о релизах
refactor(ui): вынести Footer в отдельный компонент
test(admin): добавить тесты для GroupForm

# 🔥 Breaking change
feat(api)!: изменить структуру ответа API

BREAKING CHANGE: изменилась структура JSON ответа для /api/users

# ❌ Плохие коммиты
fix: исправить баг
update: обновить код
changes: изменения
```

## 🛠️ Локальное создание релизов

### 1. Подготовка
```bash
# Убедитесь, что вы на актуальной ветке main
git checkout main
git pull origin main

# Убедитесь, что все тесты проходят
npm test
```

### 2. Создание релиза
```bash
# Интерактивный режим (рекомендуется)
npm run release

# Или указать тип релиза напрямую
npm run release:patch   # 1.0.0 -> 1.0.1
npm run release:minor   # 1.0.0 -> 1.1.0
npm run release:major   # 1.0.0 -> 2.0.0
npm run release:beta    # 1.0.0 -> 1.1.0-beta.0
```

### 3. Публикация
```bash
# Отправить изменения и теги на GitHub
git push origin main --tags
```

## 📊 Что происходит при релизе

1. **Анализ коммитов** - определяется тип изменения на основе коммитов
2. **Обновление версии** - в `package.json` и `package-lock.json`
3. **Генерация CHANGELOG.md** - на основе коммитов с последнего релиза
4. **Создание git tag** - с версией (например, `v1.1.0`)
5. **Коммит изменений** - с сообщением `chore: release v1.1.0`
6. **Push на GitHub** - отправка коммита и тега
7. **GitHub Release** - автоматическое создание релиза с changelog

## 🎨 Отображение версии

### Футер компонент

Версия отображается в футере на всех страницах:
- `components/footer.tsx` - общий футер для всех ролей
- Версия загружается из `package.json` во время сборки
- Кликабельная ссылка ведет на страницу релиза на GitHub

### Где отображается

Футер присутствует в следующих layout'ах:
- `app/admin/layout.tsx` - административная панель
- `app/student/layout.tsx` - студенческий интерфейс
- `app/lector/layout.tsx` - интерфейс преподавателя
- `app/mentor/layout.tsx` - интерфейс ментора

## 🔧 Конфигурация

### `.release-it.json`
```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}",
    "requireCleanWorkingDir": false
  },
  "github": {
    "release": true,
    "releaseName": "Release ${version}",
    "releaseNotes": "npm run changelog"
  },
  "npm": {
    "publish": false
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "angular",
      "infile": "CHANGELOG.md"
    }
  }
}
```

### `commitlint.config.js`
Проверяет формат коммитов перед их созданием.

## 📚 Связанные файлы

- `.github/workflows/release.yml` - автоматический релиз
- `.github/workflows/manual-release.yml` - ручной релиз
- `.release-it.json` - конфигурация release-it
- `commitlint.config.js` - правила для коммитов
- `CHANGELOG.md` - автоматически генерируемый список изменений
- `components/footer.tsx` - компонент футера с версией
- `package.json` - версия проекта

## 🎯 Лучшие практики

### Коммиты
1. ✅ Делайте коммиты часто - каждый логический блок изменений
2. ✅ Используйте понятные сообщения - что и зачем изменилось
3. ✅ Группируйте связанные изменения - один коммит = одна задача
4. ✅ Указывайте scope - область изменений
5. ✅ Тестируйте перед коммитом - не коммитьте сломанный код

### Релизы
1. ✅ Тестируйте перед релизом - убедитесь что все работает
2. ✅ Создавайте релизы регулярно - не накапливайте изменения
3. ✅ Документируйте breaking changes - в footer коммита
4. ✅ Используйте beta для тестирования - перед major релизом
5. ✅ Проверяйте changelog - перед публикацией релиза

### Версионирование
1. ✅ Следуйте SemVer - MAJOR.MINOR.PATCH
2. ✅ Документируйте изменения - в CHANGELOG.md
3. ✅ Тегируйте релизы - для отслеживания версий
4. ✅ Создавайте release notes - для пользователей

## 🚨 Важные моменты

- ⚠️ Все коммиты проверяются автоматически через commitlint
- ⚠️ Неправильный формат коммита приведет к ошибке
- ⚠️ Changelog генерируется автоматически на основе коммитов
- ⚠️ Версии создаются только на основе коммитов в main ветке
- ⚠️ Breaking changes требуют специального формата в коммите
- ⚠️ GitHub Actions требует настроенный GITHUB_TOKEN

## 🔍 Отладка

### Проблемы с коммитами
```bash
# Проверить формат последнего коммита
npx commitlint --from HEAD~1 --to HEAD --verbose

# Исправить последний коммит
git commit --amend -m "feat(admin): правильное сообщение"

# Проверить все коммиты в ветке
npx commitlint --from origin/main --to HEAD
```

### Проблемы с релизами
```bash
# Проверить статус
git status

# Отменить последний релиз (локально)
git tag -d v1.1.0
git reset --hard HEAD~1

# Удалить тег с GitHub
git push origin :refs/tags/v1.1.0
```

### Проблемы с GitHub Actions
1. Проверьте логи workflow в разделе Actions
2. Убедитесь что GITHUB_TOKEN настроен
3. Проверьте permissions в workflow файле
4. Убедитесь что ветка защищена правильно

## 📖 Примеры использования

### Пример 1: Добавление новой функции
```bash
# 1. Создайте ветку
git checkout -b feat/homework-notifications

# 2. Разработайте функцию
git add .
git commit -m "feat(homework): добавить email уведомления о дедлайнах"
git commit -m "test(homework): добавить тесты для уведомлений"

# 3. Создайте PR и смержите в main

# 4. GitHub Actions автоматически создаст minor релиз (v1.1.0 -> v1.2.0)
```

### Пример 2: Исправление ошибки
```bash
# 1. Создайте ветку
git checkout -b fix/validation-bug

# 2. Исправьте ошибку
git add .
git commit -m "fix(api): исправить валидацию email в форме регистрации"

# 3. Создайте PR и смержите в main

# 4. GitHub Actions автоматически создаст patch релиз (v1.1.0 -> v1.1.1)
```

### Пример 3: Breaking change
```bash
# 1. Внесите breaking changes
git commit -m "feat(api)!: изменить структуру ответа API

BREAKING CHANGE: изменилась структура JSON ответа для /api/users.
Теперь используется вложенная структура { data: {...}, meta: {...} }"

# 2. Создайте PR и смержите в main

# 3. GitHub Actions автоматически создаст major релиз (v1.1.0 -> v2.0.0)
```

### Пример 4: Ручной релиз
1. Перейдите в GitHub Actions
2. Выберите "Manual Release"
3. Нажмите "Run workflow"
4. Выберите тип релиза: `minor`
5. Нажмите "Run workflow"
6. Дождитесь завершения (обычно 2-3 минуты)
7. Проверьте новый релиз в разделе Releases

## 🔗 Полезные ссылки

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Release-it Documentation](https://github.com/release-it/release-it)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи GitHub Actions
2. Убедитесь что формат коммитов правильный
3. Проверьте что все тесты проходят
4. Обратитесь к документации выше
5. Создайте issue на GitHub

