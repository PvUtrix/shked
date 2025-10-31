# Быстрая инструкция: OpenSSF Scorecard

## 🎯 Что было сделано

В проект **Шкед** успешно интегрирован **OpenSSF Scorecard**. Вот что было добавлено:

### ✅ Добавленные файлы

1. **`.github/workflows/scorecard.yml`** — GitHub Actions workflow для автоматического запуска Scorecard
   - Запускается еженедельно по вторникам
   - Запускается при каждом push в main
   - Загружает результаты в GitHub Security tab

2. **`.github/dependabot.yml`** — Автоматические обновления зависимостей
   - Обновления npm зависимостей (ежедневно)
   - Обновления GitHub Actions (еженедельно)
   - Обновления Docker образов (еженедельно)

3. **`SECURITY.md`** — Политика безопасности в корне проекта
   - Инструкции по сообщению об уязвимостях
   - Best practices безопасности
   - Контактная информация

4. **`docs/development/SCORECARD.md`** — Полная документация по OpenSSF Scorecard
   - Что такое Scorecard и зачем он нужен
   - Критерии оценки
   - Как улучшить оценку
   - FAQ и ресурсы

### ✅ Обновленные файлы

1. **`readme.md`** — Добавлены бейджи и раздел безопасности
   - Бейдж OpenSSF Scorecard
   - Бейдж OpenSSF Best Practices
   - Расширенный раздел "Безопасность"

2. **`docs/README.md`** — Добавлена ссылка на документацию Scorecard

## 🚀 Что дальше?

### 1. Закоммитьте и запушьте изменения

```bash
git add .
git commit -m "feat(security): add OpenSSF Scorecard integration"
git push origin main
```

### 2. Дождитесь первого запуска Scorecard

После пуша в main GitHub Actions автоматически запустит Scorecard. Это займет 3-5 минут.

### 3. Проверьте результаты

#### Вариант A: Через бейдж
Через несколько минут после первого запуска кликните на бейдж в README:
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/PvUtrix/shked/badge)](https://scorecard.dev/viewer/?uri=github.com/PvUtrix/shked)

#### Вариант B: Через GitHub Security tab
1. Перейдите в **Security** → **Code scanning alerts**
2. Найдите результаты от OpenSSF Scorecard

#### Вариант C: Через GitHub Actions
1. Перейдите в **Actions**
2. Найдите workflow "OpenSSF Scorecard"
3. Посмотрите последний запуск

### 4. Улучшите оценку

После получения первых результатов:

1. **Проверьте, какие checks имеют низкую оценку**
2. **Прочитайте рекомендации** в `docs/development/SCORECARD.md`
3. **Исправьте по приоритету**:
   - Критично: Security Policy ✅ (уже сделано), Branch Protection, Code Review
   - Важно: CI Tests ✅ (уже есть), Dependency Updates ✅ (настроен Dependabot)
   - Желательно: Signed Commits, Token Permissions

### 5. Настройте Branch Protection (рекомендуется)

Чтобы получить высокую оценку, настройте защиту ветки:

1. Перейдите в **Settings** → **Branches**
2. Добавьте правило для ветки `main`
3. Включите:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (минимум 1)
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators (рекомендуется)

## 📊 Бейджи

### OpenSSF Scorecard Badge
Показывает текущую оценку безопасности проекта (от 0 до 10):

```markdown
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/PvUtrix/shked/badge)](https://scorecard.dev/viewer/?uri=github.com/PvUtrix/shked)
```

### OpenSSF Best Practices Badge (опционально)
Показывает соответствие best practices OpenSSF:

```markdown
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/YOUR_PROJECT_ID/badge)](https://www.bestpractices.dev/projects/YOUR_PROJECT_ID)
```

**Примечание:** Для Best Practices Badge нужно зарегистрировать проект на [bestpractices.dev](https://www.bestpractices.dev/) и пройти анкету.

## 🎯 Целевые показатели

Стремитесь к следующим показателям:

- 🥇 **10/10** — Отлично! Высший уровень безопасности
- 🥈 **8-9/10** — Очень хорошо! Следует best practices
- 🥉 **6-7/10** — Хорошо! Есть куда расти
- ⚠️ **< 6/10** — Требуется внимание к безопасности

## 📚 Дополнительная информация

- 📖 [Полная документация Scorecard](docs/development/SCORECARD.md)
- 🔒 [Политика безопасности](SECURITY.md)
- 🌐 [OpenSSF Scorecard официальный сайт](https://scorecard.dev/)
- 📊 [OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/)

## 💡 Советы

1. **Регулярно проверяйте оценку** — Scorecard запускается еженедельно
2. **Реагируйте на Dependabot PR** — Автоматические обновления зависимостей
3. **Подписывайте коммиты GPG** — Повышает доверие и оценку
4. **Используйте branch protection** — Предотвращает случайные изменения
5. **Проводите code review** — Всегда используйте Pull Requests

## ❓ Частые вопросы

**Q: Как часто обновляется оценка?**  
A: Автоматически еженедельно по вторникам и при каждом push в main.

**Q: Влияет ли низкая оценка на работу проекта?**  
A: Нет, это только индикатор безопасности. Но высокая оценка повышает доверие пользователей.

**Q: Нужно ли иметь 10/10?**  
A: Желательно, но даже 7-8 баллов показывают хороший уровень безопасности.

**Q: Что делать с Dependabot PR?**  
A: Проверяйте и мержите регулярно. Они помогают поддерживать проект в безопасности.

## 🎉 Готово!

Теперь проект **Шкед** имеет:
- ✅ Автоматическую оценку безопасности
- ✅ Красивые бейджи в README
- ✅ Автоматические обновления зависимостей
- ✅ Полную документацию по безопасности
- ✅ Соответствие OpenSSF best practices

---

**Удачи с улучшением оценки безопасности!** 🔒

