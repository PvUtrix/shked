#!/bin/bash
# 2025-10-31 - Скрипт для создания релиза через Pull Request
# Использование: ./scripts/release-pr.sh [patch|minor|major]

set -e

# Загружаем nvm если установлен
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

RELEASE_TYPE="${1:-patch}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🚀 Начинаю процесс релиза..."
echo "📌 Тип релиза: $RELEASE_TYPE"
echo "📌 Текущая ветка: $CURRENT_BRANCH"

# Проверяем, что мы на main
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Ошибка: вы должны быть на ветке main"
  exit 1
fi

# Проверяем, что рабочая директория чистая
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Ошибка: есть незакоммиченные изменения"
  git status --short
  exit 1
fi

# Обновляем main
echo "📥 Обновляю ветку main..."
git pull origin main

# Запускаем release-it (создаёт коммит локально, но не пушит)
echo "📝 Создаю changelog и обновляю версию..."
RELEASE_TYPE="$RELEASE_TYPE" npm run release:$RELEASE_TYPE -- --ci

# Получаем новую версию из package.json
NEW_VERSION=$(node -p "require('./package.json').version")
BRANCH_NAME="release/v$NEW_VERSION"

echo "✅ Версия обновлена до: $NEW_VERSION"

# Проверяем, есть ли коммит релиза
if [ -z "$(git log origin/main..HEAD)" ]; then
  echo "❌ Ошибка: коммит релиза не создан"
  exit 1
fi

# Создаём ветку для релиза
echo "🌿 Создаю ветку релиза: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME"

# Пушим ветку на GitHub
echo "📤 Отправляю ветку на GitHub..."
git push -u origin "$BRANCH_NAME"

# Возвращаемся на main и откатываем локальный коммит
echo "↩️  Возвращаюсь на main..."
git checkout main
git reset --hard origin/main

# Создаём тег локально (опционально)
echo "🏷️  Создаю тег v$NEW_VERSION..."
git tag "v$NEW_VERSION" "$BRANCH_NAME"
git push origin "v$NEW_VERSION"

# Извлекаем описание релиза из CHANGELOG.md
echo "📄 Извлекаю описание из CHANGELOG..."
CHANGELOG_CONTENT=$(git show "$BRANCH_NAME:CHANGELOG.md" | sed -n "/^## .*$NEW_VERSION/,/^## /p" | sed '1d;$d')

# Создаём PR автоматически с GitHub CLI
echo "🔄 Создаю Pull Request..."
if command -v gh &> /dev/null; then
  PR_BODY="# Release v$NEW_VERSION

## Изменения

$CHANGELOG_CONTENT

---

После мерджа этого PR будет создан релиз [v$NEW_VERSION](https://github.com/PvUtrix/shked/releases/new?tag=v$NEW_VERSION)"

  gh pr create \
    --base main \
    --head "$BRANCH_NAME" \
    --title "chore: release v$NEW_VERSION" \
    --body "$PR_BODY" \
    --reviewer PvUtrix 2>/dev/null || echo "⚠️  Не удалось создать PR автоматически"
  
  PR_URL=$(gh pr view "$BRANCH_NAME" --json url -q .url 2>/dev/null)
  
  if [ -n "$PR_URL" ]; then
    echo ""
    echo "✅ Готово! Pull Request создан:"
    echo "   $PR_URL"
  else
    echo ""
    echo "✅ Готово!"
    echo ""
    echo "📝 Создайте Pull Request вручную:"
    echo "   https://github.com/PvUtrix/shked/compare/$BRANCH_NAME?expand=1"
  fi
else
  echo ""
  echo "✅ Готово!"
  echo ""
  echo "📝 Создайте Pull Request:"
  echo "   https://github.com/PvUtrix/shked/compare/$BRANCH_NAME?expand=1"
fi

echo ""
echo "После мерджа PR в main, создайте GitHub Release:"
echo "   https://github.com/PvUtrix/shked/releases/new?tag=v$NEW_VERSION"
echo ""

