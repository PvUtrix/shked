# 🎉 GitHub Releases и Версионирование - Сводка изменений

## ✅ Что было реализовано

### 1. 📦 Компонент Footer с отображением версии

**Файл:** `components/footer.tsx`

Создан универсальный компонент футера, который:
- Отображает информацию о проекте
- Показывает текущую версию из `package.json`
- Содержит кликабельную ссылку на соответствующий релиз на GitHub
- Используется во всех layouts (admin, student, lector, mentor)

**Особенности:**
```typescript
import packageJson from '@/package.json'
const version = packageJson.version
```

Версия загружается во время сборки, что делает приложение легким и быстрым.

### 2. 🔄 Обновленные Layout компоненты

Обновлены следующие файлы:
- `app/admin/layout.tsx`
- `app/student/layout.tsx`
- `app/lector/layout.tsx`
- `app/mentor/layout.tsx`

Все дублирующийся код футера заменен на единый компонент `<Footer />`.

**Преимущества:**
- ✅ DRY (Don't Repeat Yourself) - нет дублирования кода
- ✅ Единая точка изменений
- ✅ Автоматическое обновление версии везде

### 3. 🤖 GitHub Actions Workflows

#### 3.1. Автоматический релиз (`release.yml`)

**Путь:** `.github/workflows/release.yml`

**Триггеры:**
- Push в ветку `main` (кроме изменений в документации)
- Ручной запуск через GitHub UI

**Что делает:**
1. Анализирует коммиты с последнего релиза
2. Определяет тип релиза автоматически:
   - `BREAKING CHANGE` → major
   - `feat:` → minor
   - `fix:`, `perf:`, etc. → patch
3. Запускает тесты и сборку
4. Создает новую версию через release-it
5. Генерирует changelog
6. Создает git tag
7. Пушит изменения на GitHub
8. Создает GitHub Release

#### 3.2. Ручной релиз (`manual-release.yml`)

**Путь:** `.github/workflows/manual-release.yml`

**Использование:**
1. Перейти в GitHub → Actions
2. Выбрать "Manual Release"
3. Нажать "Run workflow"
4. Выбрать тип релиза (patch/minor/major/beta)
5. Нажать "Run workflow"

**Преимущества:**
- Полный контроль над типом релиза
- Можно создавать beta версии
- Быстрый способ создания релиза без коммитов

### 4. 📚 Документация

#### 4.1. Полное руководство (`docs/GITHUB_RELEASES.md`)

**Содержит:**
- Обзор системы версионирования
- Формат коммитов (Conventional Commits)
- Типы релизов с примерами
- Пошаговые инструкции по созданию релизов
- Описание GitHub Actions workflows
- Troubleshooting и отладка
- Примеры использования
- Best practices

**Объем:** ~500 строк подробной документации на русском языке

#### 4.2. Обновленный README

**Путь:** `readme.md`

**Добавлено:**
- Badge с текущей версией
- Ссылка на страницу релизов
- Раздел "Версионирование и Релизы" с кратким описанием
- Команды для создания релизов
- Ссылки на подробную документацию

### 5. 🔧 Конфигурация

#### Существующие конфигурации (уже были):
- ✅ `.release-it.json` - настройки release-it
- ✅ `commitlint.config.js` - проверка формата коммитов
- ✅ `package.json` - скрипты для релизов
- ✅ `tsconfig.json` - `resolveJsonModule: true` для импорта package.json

## 📊 Статистика изменений

### Созданные файлы:
1. `components/footer.tsx` - новый компонент футера
2. `.github/workflows/release.yml` - автоматический релиз
3. `.github/workflows/manual-release.yml` - ручной релиз
4. `docs/GITHUB_RELEASES.md` - полная документация

### Обновленные файлы:
1. `app/admin/layout.tsx` - использует новый Footer
2. `app/student/layout.tsx` - использует новый Footer
3. `app/lector/layout.tsx` - использует новый Footer
4. `app/mentor/layout.tsx` - использует новый Footer
5. `readme.md` - добавлен раздел о версионировании

### Удаленные строки кода:
- ~160 строк дублирующегося кода футеров из 4 layouts

### Добавленные строки кода:
- ~30 строк в компоненте Footer
- ~100 строк в GitHub Actions workflows
- ~500 строк документации

## 🎯 Как это работает

### Локальное создание релиза:

```bash
# 1. Разработка
git add .
git commit -m "feat(admin): добавить новую функцию"

# 2. Создание релиза
npm run release:minor

# 3. Что происходит автоматически:
# - Анализируются коммиты
# - Обновляется версия в package.json (1.1.0 → 1.2.0)
# - Генерируется CHANGELOG.md
# - Создается git tag (v1.2.0)
# - Создается коммит "chore: release v1.2.0"
# - Push на GitHub

# 4. GitHub Actions автоматически:
# - Создает GitHub Release
# - Прикрепляет changelog
# - Помечает релиз (prerelease для beta)
```

### Автоматический релиз при push:

```bash
# 1. Разработка с правильными коммитами
git add .
git commit -m "feat(homework): добавить MDX редактор"
git commit -m "test(homework): добавить тесты"

# 2. Push в main
git push origin main

# 3. GitHub Actions автоматически:
# - Анализирует коммиты (feat → minor релиз)
# - Запускает тесты
# - Создает релиз v1.2.0
# - Генерирует changelog
# - Публикует на GitHub
```

### Отображение версии в приложении:

```typescript
// В компоненте Footer
import packageJson from '@/package.json'
const version = packageJson.version // "1.1.0"

// В футере
<Link href={`https://github.com/PvUtrix/shked/releases/tag/v${version}`}>
  v{version}
</Link>
```

Версия отображается на всех страницах:
- ✅ Административная панель
- ✅ Студенческий интерфейс
- ✅ Интерфейс преподавателя
- ✅ Интерфейс ментора

## 🚀 Следующие шаги

### Для начала работы:

1. **Убедитесь, что все коммиты соответствуют Conventional Commits**
   ```bash
   # ✅ Правильно
   git commit -m "feat(admin): добавить управление пользователями"
   git commit -m "fix(api): исправить валидацию email"
   
   # ❌ Неправильно
   git commit -m "update code"
   git commit -m "fix bug"
   ```

2. **Создайте первый релиз**
   ```bash
   # Локально
   npm run release:minor
   git push origin main --tags
   
   # Или через GitHub Actions
   # GitHub → Actions → Manual Release → Run workflow
   ```

3. **Проверьте, что версия отображается в футере**
   - Запустите приложение
   - Откройте любую страницу
   - Прокрутите вниз
   - Убедитесь, что версия отображается и ссылка работает

4. **Настройте автоматические релизы**
   - GitHub Actions уже настроены
   - При каждом push в main будет создаваться релиз
   - Можно отключить, убрав `on: push:` из `release.yml`

## 📖 Полезные команды

### Создание релизов:
```bash
npm run release              # интерактивный режим
npm run release:patch        # 1.0.0 → 1.0.1
npm run release:minor        # 1.0.0 → 1.1.0
npm run release:major        # 1.0.0 → 2.0.0
npm run release:beta         # 1.0.0 → 1.1.0-beta.0
```

### Работа с changelog:
```bash
npm run changelog            # создать changelog для последней версии
npm run changelog:all        # создать полный changelog
```

### Проверка коммитов:
```bash
# Проверить последний коммит
npx commitlint --from HEAD~1 --to HEAD --verbose

# Проверить все коммиты в ветке
npx commitlint --from origin/main --to HEAD
```

## 🎨 Кастомизация

### Изменить стиль футера:
Редактируйте `components/footer.tsx`

### Изменить формат версии:
Редактируйте отображение в `components/footer.tsx`:
```typescript
// Текущий формат: v1.1.0
<Link>v{version}</Link>

// Другие варианты:
<Link>Версия {version}</Link>
<Link>Release {version}</Link>
<span className="badge">v{version}</span>
```

### Изменить логику релизов:
Редактируйте `.github/workflows/release.yml`:
- Изменить триггеры
- Добавить/убрать шаги
- Настроить условия

### Изменить конфигурацию release-it:
Редактируйте `.release-it.json`:
- Формат коммитов
- Генерация changelog
- Публикация в npm (по умолчанию отключена)

## ⚠️ Важные моменты

### 1. Формат коммитов обязателен
Все коммиты должны соответствовать Conventional Commits, иначе commitlint выдаст ошибку.

### 2. Версия в package.json - источник истины
Footer загружает версию из package.json, который обновляется автоматически при релизе.

### 3. GitHub Actions требует permissions
В workflows настроены необходимые permissions:
```yaml
permissions:
  contents: write
  issues: write
  pull-requests: write
```

### 4. Не редактируйте CHANGELOG.md вручную
Он генерируется автоматически на основе коммитов. Ручные изменения будут перезаписаны.

### 5. Тегируйте релизы правильно
Формат тега: `v1.2.3` (с префиксом `v`)
release-it делает это автоматически.

## 🐛 Troubleshooting

### Проблема: Footer не отображает версию
**Решение:** Проверьте, что `tsconfig.json` содержит `"resolveJsonModule": true`

### Проблема: Ошибка при импорте package.json
**Решение:** Убедитесь, что путь правильный: `@/package.json`

### Проблема: GitHub Actions не запускается
**Решение:** 
1. Проверьте, что workflow файлы в `.github/workflows/`
2. Убедитесь, что GITHUB_TOKEN настроен (обычно автоматически)
3. Проверьте permissions в workflow

### Проблема: Коммит не проходит проверку
**Решение:** Используйте правильный формат:
```bash
type(scope): description
```

### Проблема: Релиз создался, но версия не обновилась в футере
**Решение:** 
1. Пересоберите приложение: `npm run build`
2. Перезапустите dev сервер: `npm run dev`

## 🎓 Обучающие материалы

### Recommended reading:
1. [Conventional Commits](https://www.conventionalcommits.org/)
2. [Semantic Versioning](https://semver.org/)
3. [Release-it Documentation](https://github.com/release-it/release-it)
4. [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Внутренняя документация:
1. `docs/GITHUB_RELEASES.md` - полное руководство
2. `docs/RELEASE_GUIDE.md` - краткое руководство
3. `docs/VERSIONING.md` - руководство по версионированию

## ✨ Преимущества реализации

### Для разработчиков:
- ✅ Автоматизация рутинных задач
- ✅ Консистентное версионирование
- ✅ Автоматическая генерация changelog
- ✅ Четкая история изменений
- ✅ Легкий откат к предыдущим версиям

### Для пользователей:
- ✅ Прозрачность разработки
- ✅ Понимание, какая версия установлена
- ✅ Доступ к списку изменений
- ✅ Легкий способ сообщить о проблемах в конкретной версии

### Для проекта:
- ✅ Профессиональный подход
- ✅ Соответствие best practices
- ✅ Готовность к масштабированию
- ✅ Легкая интеграция с CI/CD

## 🎉 Заключение

Система версионирования и релизов полностью настроена и готова к использованию!

**Что было сделано:**
- ✅ Компонент Footer с отображением версии
- ✅ GitHub Actions для автоматических и ручных релизов
- ✅ Comprehensive документация на русском языке
- ✅ Обновленный README с информацией о версионировании
- ✅ Рефакторинг layouts для использования единого Footer

**Что нужно сделать:**
1. Создать первый официальный релиз
2. Протестировать автоматические релизы
3. Убедиться, что версия отображается корректно
4. Обучить команду работе с Conventional Commits

**Результат:**
Профессиональная система управления версиями, соответствующая индустриальным стандартам, с полной автоматизацией через GitHub Actions и прозрачным отображением версии для пользователей.

---

Создано: 20 октября 2025
Автор: AI Assistant
Проект: SmartSchedule (Шкед)

