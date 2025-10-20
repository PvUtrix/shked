# TODO: Документация компонентов

> Задача на будущее: задокументировать ключевые React компоненты

## Зачем нужно

Документация компонентов поможет разработчикам понять:
- Какие props принимает компонент
- Как его использовать
- Примеры использования
- Связи с другими компонентами

## Список компонентов для документирования

### UI компоненты (приоритет: средний)
- [ ] `button.tsx` - базовая кнопка
- [ ] `dialog.tsx` - модальные окна
- [ ] `form.tsx` - формы с валидацией
- [ ] `calendar.tsx` - календарь для выбора дат
- [ ] `card.tsx` - карточки контента
- [ ] `table.tsx` - таблицы
- [ ] `select.tsx` - выпадающие списки
- [ ] `input.tsx` - текстовые поля

### MDX компоненты (приоритет: высокий)
- [ ] `markdown-editor.tsx` - редактор MDX
- [ ] `markdown-viewer.tsx` - просмотр MDX
- [ ] `inline-comment-viewer.tsx` - инлайн-комментарии

### Admin компоненты (приоритет: средний)
- [ ] `user-form.tsx` - форма пользователя
- [ ] `group-form.tsx` - форма группы
- [ ] `schedule-form.tsx` - форма расписания
- [ ] `subject-form.tsx` - форма предмета

### Student компоненты (приоритет: высокий)
- [ ] `homework-submission-form.tsx` - форма сдачи ДЗ

### Lector компоненты (приоритет: высокий)
- [ ] `homework-form.tsx` - форма создания ДЗ

### Навигация (приоритет: низкий)
- [ ] `admin-nav.tsx`
- [ ] `lector-nav.tsx`
- [ ] `mentor-nav.tsx`
- [ ] `student-nav.tsx`

## Формат документации

Создавать файлы в `obsidian-vault/02-Компоненты/`

```markdown
# ComponentName

> Краткое описание компонента

## Описание

Подробное описание назначения компонента.

## Props

\`\`\`typescript
interface ComponentProps {
  prop1: string
  prop2?: number
  onAction: () => void
}
\`\`\`

## Примеры использования

\`\`\`tsx
<Component prop1="value" onAction={handleAction} />
\`\`\`

## Связанные заметки

- [[Related Component]]
- [[API Endpoint]]

## Файлы

- **Компонент**: `components/path/to/component.tsx`
```

## Приоритизация

1. **Высокий приоритет** (критичные для понимания системы):
   - markdown-editor.tsx
   - markdown-viewer.tsx
   - inline-comment-viewer.tsx
   - homework-submission-form.tsx
   - homework-form.tsx

2. **Средний приоритет** (часто используемые):
   - Формы (user-form, group-form, schedule-form, subject-form)
   - UI компоненты (button, dialog, form, calendar)

3. **Низкий приоритет** (можно отложить):
   - Навигационные компоненты
   - Простые UI компоненты

## Оценка времени

- Высокий приоритет: ~5 компонентов × 10 мин = **50 минут**
- Средний приоритет: ~8 компонентов × 8 мин = **64 минуты**
- Низкий приоритет: ~10 компонентов × 5 мин = **50 минут**

**Итого**: ~2.5 часа для всех компонентов

## Как начать

```bash
# Создать папку
mkdir obsidian-vault/02-Компоненты

# Начать с высокого приоритета
# Изучить компонент components/ui/markdown-editor.tsx
# Создать obsidian-vault/02-Компоненты/markdown-editor.md
```

---

**Статус**: ⏳ TODO  
**Создано**: 2024-11-05  
**Ответственный**: Разработчик документации

