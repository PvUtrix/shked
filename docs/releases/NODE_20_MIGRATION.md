# Миграция на Node.js 20

## Дата: 2025-10-20

## Проблема

При запуске релизного процесса в GitHub Actions возникала ошибка:

```
SyntaxError: Invalid regular expression flags
    at ModuleLoader.moduleStrategy (node:internal/modules/esm/translators:152:18)

Node.js v18.20.8
```

### Причина

Пакет `ora` (через зависимость `string-width`) использует флаг регулярного выражения `v`, который доступен только в Node.js 20+. В GitHub Actions использовался Node.js 18.20.8.

## Решение

Обновлена версия Node.js с 18 до 20 во всех конфигурационных файлах:

### Измененные файлы:

1. **GitHub Actions workflows:**
   - `.github/workflows/release.yml`
   - `.github/workflows/manual-release.yml`
   - `.github/workflows/ci.yml`
   - `.github/workflows/test.yml`

2. **Docker:**
   - `Dockerfile` (все 3 этапа: deps, builder, runner)

3. **Package.json:**
   - Добавлено поле `engines` с требованием Node.js >= 20.0.0

4. **Новые файлы:**
   - `.nvmrc` - для локальной разработки с nvm

## Требования

### Локальная разработка

Для разработчиков, использующих `nvm`:

```bash
nvm use
```

Или установите Node.js 20 вручную:

```bash
nvm install 20
nvm use 20
```

### CI/CD

Все GitHub Actions workflow теперь используют Node.js 20 автоматически.

### Docker

Все Docker образы теперь используют `node:20-alpine`.

## Совместимость

- **Node.js:** >= 20.0.0 (обязательно)
- **npm:** >= 9.0.0 (рекомендуется)

## Проверка версии

После обновления проверьте версию Node.js:

```bash
node --version
# Должно быть >= v20.0.0
```

## Связанные изменения

- Все зависимости проекта совместимы с Node.js 20
- Никаких изменений в коде приложения не требуется
- Prisma и Next.js полностью поддерживают Node.js 20

## Примечания

- Node.js 18 вышел из LTS фазы активной поддержки
- Node.js 20 является текущей LTS версией
- Переход на Node.js 20 обеспечивает лучшую производительность и безопасность


