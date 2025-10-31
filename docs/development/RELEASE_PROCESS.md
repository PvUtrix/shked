# 🚀 Процесс релиза

Этот документ описывает автоматизированный процесс создания релизов для проекта SmartSchedule (ШКЕД).

## 📋 Предварительные требования

1. **GitHub CLI** - должен быть установлен и авторизован:
   ```bash
   # Установка (macOS)
   brew install gh
   
   # Авторизация
   gh auth login
   ```

2. **Права доступа** - вы должны иметь права на создание PR в репозитории

3. **Чистая рабочая директория** - все изменения должны быть закоммичены

## 🎯 Процесс создания релиза

### Шаг 1: Запуск скрипта релиза

Скрипт `scripts/release-pr.sh` автоматизирует весь процесс:

```bash
# Patch релиз (2.0.0 → 2.0.1)
./scripts/release-pr.sh patch

# Minor релиз (2.0.0 → 2.1.0)
./scripts/release-pr.sh minor

# Major релиз (2.0.0 → 3.0.0)
./scripts/release-pr.sh major
```

### Шаг 2: Что делает скрипт

Скрипт автоматически выполняет следующие действия:

1. ✅ Проверяет, что вы на ветке `main`
2. ✅ Проверяет, что рабочая директория чистая
3. ✅ Обновляет локальную ветку `main` с `origin/main`
4. ✅ Запускает `release-it` для:
   - Обновления версии в `package.json` и `package-lock.json`
   - Генерации CHANGELOG.md
   - Создания коммита с релизом
5. ✅ Создаёт новую ветку `release/v{version}`
6. ✅ Пушит ветку на GitHub
7. ✅ Откатывает локальную ветку `main` (чтобы оставить её чистой)
8. ✅ Создаёт и пушит тег `v{version}`
9. ✅ **Автоматически создаёт Pull Request** с описанием из CHANGELOG
10. ✅ Выводит ссылку на PR

### Шаг 3: Проверка и мердж PR

После запуска скрипта:

1. Откройте созданный Pull Request (ссылка будет выведена в консоли)
2. Проверьте изменения:
   - `package.json` - новая версия
   - `package-lock.json` - обновлённая версия
   - `CHANGELOG.md` - список изменений
3. Если всё в порядке - нажмите "Merge pull request"

### Шаг 4: Создание GitHub Release

После мерджа PR в `main`:

1. Перейдите по ссылке создания релиза (будет в описании PR)
2. Или вручную: [Создать релиз](https://github.com/PvUtrix/shked/releases/new)
3. Выберите тег `v{version}`
4. Скопируйте описание из CHANGELOG.md
5. Нажмите "Publish release"

## 📝 Формат коммитов

Проект использует [Conventional Commits](https://www.conventionalcommits.org/):

### Типы коммитов

- `feat:` - новая функциональность (увеличивает MINOR версию)
- `fix:` - исправление ошибки (увеличивает PATCH версию)
- `docs:` - изменения в документации
- `style:` - форматирование кода (без изменения логики)
- `refactor:` - рефакторинг кода
- `perf:` - улучшение производительности
- `test:` - добавление или изменение тестов
- `chore:` - изменения в сборке, зависимостях и т.д.
- `revert:` - откат предыдущих изменений

### Примеры коммитов

```bash
# Feature - увеличит MINOR версию при релизе
git commit -m "feat(homework): добавить возможность прикреплять файлы к домашним заданиям"

# Fix - увеличит PATCH версию при релизе
git commit -m "fix(auth): исправить ошибку авторизации для роли teacher"

# Breaking change - увеличит MAJOR версию при релизе
git commit -m "feat(api)!: изменить формат API ответа для расписаний"
# или
git commit -m "feat(api): изменить формат API ответа для расписаний

BREAKING CHANGE: формат ответа изменён с массива на объект"

# Обычный коммит - не влияет на версию
git commit -m "docs: обновить README с инструкциями по деплою"
```

## 🔧 Настройка

### Конфигурация release-it

Конфигурация находится в `.release-it.json`:

```json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}",
    "requireCleanWorkingDir": false,
    "push": false,
    "commit": true,
    "tag": false,
    "requireBranch": false
  },
  "github": {
    "release": false
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

### Скрипты в package.json

```json
{
  "scripts": {
    "release:patch": "release-it patch",
    "release:minor": "release-it minor",
    "release:major": "release-it major",
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s -r 0"
  }
}
```

## 🚨 Решение проблем

### Проблема: "npm: command not found"

**Решение**: Скрипт загружает nvm автоматически. Если проблема сохраняется:

```bash
# Проверьте путь к nvm
echo $NVM_DIR

# Должно быть: /Users/{username}/.nvm
```

### Проблема: "gh: command not found"

**Решение**: Установите GitHub CLI:

```bash
brew install gh
gh auth login
```

### Проблема: "remote rejected main (protected branch)"

Это нормально! Именно для этого мы используем процесс через PR. Скрипт автоматически:
- Создаёт отдельную ветку `release/v{version}`
- Создаёт PR из этой ветки в `main`
- Откатывает локальные изменения в `main`

### Проблема: PR не создаётся автоматически

Если автоматическое создание PR не работает:

1. Скопируйте ссылку из вывода скрипта
2. Откройте её в браузере
3. Создайте PR вручную
4. Скопируйте описание из CHANGELOG.md

## 📚 Дополнительные ресурсы

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [release-it Documentation](https://github.com/release-it/release-it)
- [GitHub CLI Documentation](https://cli.github.com/manual/)

## 🎓 Примеры

### Полный цикл создания patch релиза

```bash
# 1. Убедитесь что на main и всё закоммичено
git checkout main
git status

# 2. Запустите скрипт релиза
./scripts/release-pr.sh patch

# Вывод:
# 🚀 Начинаю процесс релиза...
# 📌 Тип релиза: patch
# 📌 Текущая ветка: main
# ...
# ✅ Готово! Pull Request создан:
#    https://github.com/PvUtrix/shked/pull/22

# 3. Откройте PR, проверьте и смержите

# 4. Создайте GitHub Release по ссылке из PR
```

### Если нужно отменить релиз

```bash
# Удалить локальную ветку релиза
git branch -D release/v2.0.1

# Удалить удалённую ветку релиза
git push origin --delete release/v2.0.1

# Удалить тег
git tag -d v2.0.1
git push origin --delete v2.0.1

# Закрыть PR на GitHub
gh pr close 22
```

## 📊 Версионирование

Проект следует [Semantic Versioning](https://semver.org/):

- **MAJOR** (3.0.0) - несовместимые изменения API
- **MINOR** (2.1.0) - новая функциональность (обратно совместимая)
- **PATCH** (2.0.1) - исправления ошибок (обратно совместимые)

### Автоматическое определение типа релиза

`release-it` с плагином `conventional-changelog` автоматически определяет тип релиза на основе коммитов:

- Коммит с `feat:` → увеличивает **MINOR**
- Коммит с `fix:` → увеличивает **PATCH**
- Коммит с `BREAKING CHANGE:` или `!` → увеличивает **MAJOR**

Однако вы можете переопределить это при запуске скрипта:

```bash
# Принудительно создать minor релиз, даже если только fix коммиты
./scripts/release-pr.sh minor
```

## ✅ Чеклист релиза

Перед созданием релиза убедитесь:

- [ ] Все изменения закоммичены
- [ ] Все тесты проходят (`npm test`)
- [ ] Нет ошибок линтера (`npm run lint`)
- [ ] Документация обновлена
- [ ] CHANGELOG.md актуален (генерируется автоматически)
- [ ] Вы на ветке `main`
- [ ] Локальная ветка `main` синхронизирована с `origin/main`

После мерджа PR:

- [ ] PR смержен в `main`
- [ ] GitHub Release создан
- [ ] Деплой выполнен успешно (если настроен)
- [ ] Telegram бот уведомил о новой версии (если настроено)

