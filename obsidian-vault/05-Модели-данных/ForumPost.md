# ForumPost (Сообщение форума)

> Модель для сообщений в темах форума

## Обзор

Модель `ForumPost` представляет отдельное сообщение в теме форума.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
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

## Иерархия сообщений

Сообщения поддерживают древовидную структуру через `parentPostId`:
- Если `parentPostId = null` - это основное сообщение в теме
- Если указан - это ответ на другое сообщение

## Связи

- `topic` - Тема [[ForumTopic]]
- `author` - Автор [[User]]
- `parentPost` - Родительское сообщение (опционально)
- `replies` - Ответы на это сообщение

## API

**Endpoints**:
- `GET /api/forum/topics/{topicId}/posts`
- `POST /api/forum/topics/{topicId}/posts`
- `PATCH /api/forum/posts/{id}`
- `DELETE /api/forum/posts/{id}`

---

#model #forum #post #prisma


