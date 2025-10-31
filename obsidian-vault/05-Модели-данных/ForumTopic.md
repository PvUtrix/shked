# ForumTopic (Тема форума)

> Модель для обсуждений и вопросов на форуме

## Обзор

Модель `ForumTopic` представляет тему обсуждения на форуме системы.

**Файл**: `prisma/schema.prisma`

## Схема данных

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
```

## Типы тем

- `ANNOUNCEMENT` - Объявление
- `DISCUSSION` - Обсуждение
- `QUESTION` - Вопрос
- `HOMEWORK_HELP` - Помощь с ДЗ

## Видимость

- `PUBLIC` - Видна всем
- `GROUP` - Видна группе
- `SUBJECT` - Видна участникам предмета

## Связи

- `author` - Автор [[User]]
- `group` - Группа [[Group]] (опционально)
- `subject` - Предмет [[Subject]] (опционально)
- `posts` - Сообщения [[ForumPost]]

## API

См. [docs/features/FORUM_SYSTEM.md](../../docs/features/FORUM_SYSTEM.md)

**Endpoints**:
- `GET /api/forum/topics`
- `POST /api/forum/topics`
- `PATCH /api/forum/topics/{id}`
- `DELETE /api/forum/topics/{id}`

---

#model #forum #discussion #prisma


