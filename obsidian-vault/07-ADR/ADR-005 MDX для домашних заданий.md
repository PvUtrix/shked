# ADR-005: MDX для домашних заданий

**Статус**: ✅ Принято  
**Дата**: Март 2024  
**Авторы**: Павел Шершнёв  
**Связи**: [[Homework]], [[HomeworkSubmission]], [[Система домашних заданий]]

## Контекст и проблема

Преподавателям и студентам нужен способ создавать и сдавать домашние задания с:
- Форматированным текстом (заголовки, списки, жирный/курсив)
- Блоками кода с подсветкой синтаксиса
- Таблицами
- Математическими формулами (опционально)
- Изображениями
- Ссылками

Plain text недостаточно функционален, а HTML небезопасен без санитизации.

## Рассмотренные варианты

### 1. MDX с @mdxeditor/editor ✅
**Описание**: Markdown с React компонентами + WYSIWYG редактор

**Плюсы**:
- ✅ WYSIWYG редактор (не нужно знать Markdown)
- ✅ GitHub Flavored Markdown
- ✅ Таблицы, задачи, code blocks
- ✅ React компоненты для preview
- ✅ TypeScript из коробки
- ✅ Легкая интеграция с Next.js
- ✅ Безопасный (санитизация встроена)
- ✅ Расширяемый плагинами

**Минусы**:
- ⚠️ Тяжелый bundle (~500KB)
- ⚠️ Только client component
- ⚠️ Требует "use client"

### 2. TipTap
**Описание**: Headless WYSIWYG редактор

**Плюсы**:
- ✅ Гибкий и расширяемый
- ✅ Много плагинов

**Минусы**:
- ❌ Хранит в HTML (проблема с санитизацией)
- ❌ Сложнее настройка
- ❌ Нет встроенной Markdown поддержки

### 3. Quill.js
**Описание**: Rich text редактор

**Плюсы**:
- ✅ Популярный

**Минусы**:
- ❌ Старый (меньше обновлений)
- ❌ Хранит в HTML/Delta format
- ❌ Плохая TypeScript поддержка

### 4. Простой textarea + Markdown preview
**Описание**: Split-view редактор

**Плюсы**:
- ✅ Легковесный
- ✅ Простой

**Минусы**:
- ❌ Нужно знать Markdown синтаксис
- ❌ Хуже UX для студентов
- ❌ Нет WYSIWYG

### 5. Rich Text (HTML)
**Описание**: Хранение в HTML

**Плюсы**:
- ✅ Много редакторов

**Минусы**:
- ❌ Безопасность (XSS атаки)
- ❌ Нужна санитизация (DOMPurify)
- ❌ Сложнее парсинг
- ❌ Больше размер данных

## Решение

**Выбран MDX с @mdxeditor/editor**

### Обоснование

1. **WYSIWYG + Markdown**: Студентам проще использовать визуальный редактор

2. **Безопасность**: Markdown безопасен по умолчанию, нет XSS рисков

3. **GitHub Flavored Markdown**: Стандарт, знакомый разработчикам

4. **Code Blocks**: Критично для технических заданий (программирование, алгоритмы)

5. **Таблицы**: Удобно для оформления результатов

6. **Хранение в тексте**: Markdown хранится как plain text в PostgreSQL

## Архитектура

### Схема БД

```prisma
model Homework {
  id          String   @id @default(cuid())
  title       String
  description String?
  content     String?  // MDX контент задания
  taskUrl     String?
  deadline    DateTime
  // ...
}

model HomeworkSubmission {
  id          String   @id @default(cuid())
  homeworkId  String
  userId      String
  content     String?  // MDX контент работы студента
  submissionUrl String?
  status      String   @default("NOT_SUBMITTED")
  grade       Int?
  comment     String?  // Комментарий (MDX)
  feedback    String?  // Развернутая обратная связь (MDX)
  // ...
}
```

### Компоненты

#### Markdown Editor (Client Component)
**Файл**: `components/ui/markdown-editor.tsx`

```typescript
'use client'

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertCodeBlock
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder
}: MarkdownEditorProps) {
  return (
    <MDXEditor
      markdown={value}
      onChange={onChange}
      placeholder={placeholder || 'Начните вводить текст...'}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        imagePlugin(),
        tablePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'python' }),
        codeMirrorPlugin({
          codeBlockLanguages: {
            python: 'Python',
            javascript: 'JavaScript',
            typescript: 'TypeScript',
            sql: 'SQL',
            bash: 'Bash'
          }
        }),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              <BlockTypeSelect />
              <ListsToggle />
              <CreateLink />
              <InsertImage />
              <InsertTable />
              <InsertCodeBlock />
            </>
          )
        })
      ]}
    />
  )
}
```

#### Markdown Viewer (Server Component)
**Файл**: `components/ui/markdown-viewer.tsx`

```typescript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownViewerProps {
  content: string
  className?: string
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
```

### Использование

#### Создание задания (Lector)
**Файл**: `components/lector/homework-form.tsx`

```typescript
'use client'

import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { useState } from 'react'

export function HomeworkForm() {
  const [content, setContent] = useState('')
  
  async function handleSubmit() {
    await fetch('/api/homework', {
      method: 'POST',
      body: JSON.stringify({
        title: '...',
        content: content, // MDX
        deadline: '...'
      })
    })
  }
  
  return (
    <form>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Опишите задание..."
      />
      <button onClick={handleSubmit}>Создать задание</button>
    </form>
  )
}
```

#### Просмотр задания (Student)
**Файл**: `app/student/homework/[id]/page.tsx`

```typescript
import { MarkdownViewer } from '@/components/ui/markdown-viewer'
import { prisma } from '@/lib/db'

export default async function HomeworkPage({ params }) {
  const homework = await prisma.homework.findUnique({
    where: { id: params.id }
  })
  
  return (
    <div>
      <h1>{homework.title}</h1>
      <MarkdownViewer content={homework.content || ''} />
      {/* Форма сдачи */}
    </div>
  )
}
```

## Поддерживаемый синтаксис

### Заголовки
```markdown
# H1
## H2
### H3
```

### Текст
```markdown
**Жирный**
*Курсив*
~~Зачеркнутый~~
`Код`
```

### Списки
```markdown
- Маркированный
- Список

1. Нумерованный
2. Список

- [ ] Задача
- [x] Выполнена
```

### Ссылки и изображения
```markdown
[Текст ссылки](https://example.com)
![Alt текст](https://example.com/image.png)
```

### Код
````markdown
```python
def hello():
    print("Hello, World!")
```
````

### Таблицы
```markdown
| Заголовок 1 | Заголовок 2 |
|-------------|-------------|
| Ячейка 1    | Ячейка 2    |
```

### Цитаты
```markdown
> Это цитата
```

## Последствия

### Положительные

- ✅ **Удобство**: WYSIWYG редактор для студентов
- ✅ **Безопасность**: Markdown безопасен по умолчанию
- ✅ **Читаемость**: Легко читать в БД (plain text)
- ✅ **Версионирование**: Можно хранить в Git
- ✅ **Code blocks**: Отлично для технических заданий
- ✅ **Совместимость**: Работает везде (GitHub, Notion, etc.)

### Негативные

- ⚠️ **Bundle size**: ~500KB для редактора
- ⚠️ **Client-only**: Редактор только на клиенте
- ⚠️ **Первая загрузка**: Медленнее из-за размера

### Смягчения

1. **Dynamic import**: Загружаем редактор только при необходимости
2. **Code splitting**: Next.js автоматически разбивает bundle
3. **Viewer on server**: Просмотр на сервере (быстрее)

## Примеры использования

### Создание задания с кодом
```markdown
# Лабораторная работа №1

## Задание
Реализуйте алгоритм QuickSort

## Требования
- Реализовать на Python
- Добавить тесты
- Сложность O(n log n)

## Пример
```python
def quicksort(arr):
    # Ваш код здесь
    pass
```

## Критерии оценки
| Критерий | Баллы |
|----------|-------|
| Работоспособность | 5 |
| Тесты | 3 |
| Документация | 2 |
```

### Сдача работы студентом
```markdown
# Решение

Реализовал QuickSort:

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
```

## Тесты
- ✅ Пустой массив
- ✅ Один элемент
- ✅ Отсортированный
- ✅ Обратно отсортированный
```

### Feedback от лектора
```markdown
# Отличная работа! 10/10

## Плюсы
- ✅ Чистый код
- ✅ Хорошие тесты
- ✅ Правильная сложность

## Предложения
- Можно добавить in-place версию для экономии памяти
- Рассмотрите randomized pivot для лучшей производительности
```

## Влияние на другие компоненты

### Затронутые области
- [[Homework]] - поле `content` (MDX)
- [[HomeworkSubmission]] - поля `content`, `comment`, `feedback` (MDX)
- [[Lector компоненты]] - формы создания ДЗ
- [[Student компоненты]] - формы сдачи ДЗ
- [[UI компоненты]] - markdown-editor, markdown-viewer

### Связанные решения
- [[ADR-001 Next.js 14 App Router]] - интеграция client components
- [[ADR-002 Prisma ORM]] - хранение в String полях

## Ссылки

### Документация
- [@mdxeditor/editor](https://mdxeditor.dev/)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

### Внутренние ресурсы
- [[Homework]] - модель
- [[HomeworkSubmission]] - модель
- [[Система домашних заданий]] - функция
- Официальная: [docs/features/MDX_EDITOR_INTEGRATION.md](../../docs/features/MDX_EDITOR_INTEGRATION.md)

## История обновлений

- **2024-03**: Первоначальное решение
- **2024-04**: Добавлена подсветка синтаксиса
- **2024-10**: Оптимизирован bundle size через dynamic import

---

#adr #architecture #mdx #markdown #editor #homework #decision

