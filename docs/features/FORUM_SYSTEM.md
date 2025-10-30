# 💬 Форум и обсуждения

## Обзор

Система форума ШКЕД позволяет создавать обсуждения и вести диалог между студентами, преподавателями и администрацией.

## Типы тем

- `ANNOUNCEMENT` - Объявление (только чтение для студентов)
- `DISCUSSION` - Общее обсуждение
- `QUESTION` - Вопрос
- `HOMEWORK_HELP` - Помощь с домашним заданием

## Видимость тем

- `PUBLIC` - Видна всем пользователям
- `GROUP` - Видна только конкретной группе
- `SUBJECT` - Видна только студентам и преподавателям предмета

## Создание темы

### API Endpoint

**POST** `/api/forum/topics`

**Тело запроса:**
```json
{
  "title": "Вопрос по лекции 5",
  "content": "Не могу понять концепцию X. Можете объяснить подробнее?",
  "topicType": "QUESTION",
  "visibility": "SUBJECT",
  "groupId": "group_id",
  "subjectId": "subject_id"
}
```

**Права доступа:** все авторизованные пользователи

### Обязательные поля

- `title` - Заголовок темы
- `content` - Содержание (поддерживает MDX)
- `topicType` - Тип темы
- `visibility` - Видимость

### Опциональные привязки

- `groupId` - Привязка к группе (для GROUP visibility)
- `subjectId` - Привязка к предмету (для SUBJECT visibility)

## Просмотр тем

### Список тем

**GET** `/api/forum/topics?groupId={groupId}&subjectId={subjectId}&topicType={type}`

**Параметры запроса:**
- `groupId` - Фильтр по группе
- `subjectId` - Фильтр по предмету
- `topicType` - Фильтр по типу

**Автоматическая фильтрация по видимости:**
- PUBLIC темы видны всем
- GROUP темы видны только членам группы
- SUBJECT темы видны только участникам предмета

**Ответ:**
```json
[
  {
    "id": "topic_id",
    "title": "Вопрос по лекции 5",
    "content": "Не могу понять концепцию X...",
    "topicType": "QUESTION",
    "visibility": "SUBJECT",
    "isPinned": false,
    "isClosed": false,
    "viewCount": 42,
    "createdAt": "2025-11-01T10:00:00Z",
    "updatedAt": "2025-11-01T12:30:00Z",
    "author": {
      "id": "user_id",
      "name": "Имя Фамилия",
      "role": "student"
    },
    "group": {
      "id": "group_id",
      "name": "Б05-123"
    },
    "subject": {
      "id": "subject_id",
      "name": "Название предмета"
    },
    "_count": {
      "posts": 5
    }
  }
]
```

### Детали темы

**GET** `/api/forum/topics/{topicId}`

При просмотре темы автоматически увеличивается счетчик просмотров.

## Публикация сообщения

### API Endpoint

**POST** `/api/forum/topics/{topicId}/posts`

**Тело запроса:**
```json
{
  "content": "# Ответ на вопрос\n\nКонцепция X означает...",
  "parentPostId": "parent_post_id"  // Опционально, для ответа на конкретный пост
}
```

**Права доступа:** все пользователи с доступом к теме

**Примечание:** Контент поддерживает MDX форматирование.

## Просмотр сообщений

### Список сообщений в теме

**GET** `/api/forum/topics/{topicId}/posts`

**Ответ:**
```json
[
  {
    "id": "post_id",
    "topicId": "topic_id",
    "content": "# Ответ на вопрос...",
    "parentPostId": null,
    "createdAt": "2025-11-01T11:00:00Z",
    "updatedAt": "2025-11-01T11:00:00Z",
    "author": {
      "id": "user_id",
      "name": "Имя Преподавателя",
      "role": "teacher"
    },
    "replies": [
      {
        "id": "reply_post_id",
        "content": "Спасибо, теперь понятно!",
        "createdAt": "2025-11-01T11:30:00Z",
        "author": {
          "id": "student_id",
          "name": "Имя Студента"
        }
      }
    ]
  }
]
```

## Редактирование и удаление

### Обновление темы

**PATCH** `/api/forum/topics/{topicId}`

**Тело запроса:**
```json
{
  "title": "Обновленный заголовок",
  "content": "Обновленное содержание",
  "isPinned": true,
  "isClosed": false
}
```

**Права доступа:**
- Автор может редактировать title и content
- Admin может редактировать все поля
- Teacher может закреплять и закрывать темы своего предмета

### Обновление сообщения

**PATCH** `/api/forum/posts/{postId}`

**Права доступа:** только автор сообщения

### Удаление темы

**DELETE** `/api/forum/topics/{topicId}`

**Права доступа:** admin или автор темы

### Удаление сообщения

**DELETE** `/api/forum/posts/{postId}`

**Права доступа:** admin или автор сообщения

## Модерация

### Закрепление темы

Закрепленные темы отображаются в топе списка.

```json
PATCH /api/forum/topics/{topicId}
{
  "isPinned": true
}
```

**Права доступа:** admin, teacher (для своих предметов)

### Закрытие темы

Закрытая тема не принимает новые сообщения.

```json
PATCH /api/forum/topics/{topicId}
{
  "isClosed": true
}
```

**Права доступа:** admin, teacher (для своих предметов)

## Права доступа

| Роль | Создание тем | Публикация постов | Модерация | Удаление чужих постов |
|------|--------------|-------------------|-----------|----------------------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Teacher | ✅ | ✅ | ✅ (свои предметы) | ✅ (свои предметы) |
| Student | ✅ | ✅ | ❌ | ❌ |
| Mentor | ✅ | ✅ | ❌ | ❌ |

## Модель данных

```prisma
model ForumTopic {
  id         String   @id @default(cuid())
  title      String
  content    String   @db.Text // MDX
  topicType  String   @default("DISCUSSION") // ANNOUNCEMENT, DISCUSSION, QUESTION, HOMEWORK_HELP
  visibility String   @default("PUBLIC") // PUBLIC, GROUP, SUBJECT
  authorId   String
  groupId    String?
  subjectId  String?
  isPinned   Boolean  @default(false)
  isClosed   Boolean  @default(false)
  viewCount  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  author     User     @relation(fields: [authorId], references: [id])
  group      Group?   @relation(fields: [groupId], references: [id])
  subject    Subject? @relation(fields: [subjectId], references: [id])
  posts      ForumPost[]
  
  @@map("forum_topics")
}

model ForumPost {
  id           String     @id @default(cuid())
  topicId      String
  content      String     @db.Text // MDX
  authorId     String
  parentPostId String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  
  topic        ForumTopic @relation(fields: [topicId], references: [id], onDelete: Cascade)
  author       User       @relation(fields: [authorId], references: [id])
  parentPost   ForumPost? @relation("PostReplies", fields: [parentPostId], references: [id])
  replies      ForumPost[] @relation("PostReplies")
  
  @@map("forum_posts")
}
```

## Сценарии использования

### Сценарий 1: Объявление от преподавателя

1. Преподаватель создает тему типа ANNOUNCEMENT
2. Устанавливает visibility = SUBJECT
3. Публикует важное объявление
4. Закрепляет тему (isPinned = true)
5. Все студенты предмета видят объявление в топе

### Сценарий 2: Вопрос студента

1. Студент создает тему типа QUESTION
2. Описывает проблему с пониманием материала
3. Другие студенты и преподаватель видят вопрос
4. Преподаватель публикует развернутый ответ
5. Студент благодарит и преподаватель закрывает тему

### Сценарий 3: Обсуждение домашнего задания

1. Студент создает тему HOMEWORK_HELP
2. Описывает сложности с заданием
3. Другие студенты помогают советами
4. Преподаватель направляет обсуждение
5. Студенты решают задачу коллективно

## Best Practices

1. **Понятные заголовки** - заголовок должен кратко описывать суть темы
2. **Правильный тип** - выбирайте подходящий тип темы
3. **MDX форматирование** - используйте заголовки, списки, код блоки
4. **Видимость** - устанавливайте правильную видимость темы
5. **Модерация** - своевременно закрепляйте важные темы
6. **Закрытие** - закрывайте решенные вопросы

## Пример MDX контента

### Объявление преподавателя

```markdown
# 📢 Важное объявление: изменение даты экзамена

## Причина переноса

В связи с праздничными днями экзамен переносится.

## Новая дата

- **Было:** 20 декабря 2025, 10:00
- **Стало:** 22 декабря 2025, 10:00

## Что нужно подготовить

1. Повторить темы 1-12
2. Решить задачи из методички
3. Подготовить ответы на контрольные вопросы

## Контакты

По всем вопросам обращаться в личные сообщения или на email.
```

### Вопрос студента

```markdown
# Вопрос по лекции 5: концепция инкапсуляции

## Проблема

Не могу понять, как правильно использовать инкапсуляцию в следующем примере:

\`\`\`python
class BankAccount:
    def __init__(self, balance):
        self.balance = balance  # Это публичное поле?
\`\`\`

## Что я пробовал

Читал документацию Python, но там не очень понятно объяснено.

## Вопросы

1. Как сделать поле приватным?
2. Зачем нужны геттеры и сеттеры?
3. Есть ли разница между `_balance` и `__balance`?
```

## Уведомления

### Telegram уведомления (планируется)

- Новая тема в предмете студента
- Ответ на тему автора
- Упоминание пользователя в посте (@username)
- Закрепление важной темы
- Ответ преподавателя на вопрос

---

*Документация обновлена: 30 октября 2025*
*Версия системы: 2.0.0*


