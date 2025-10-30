# SubjectTeacher (Привязка преподавателя к предмету)

> Модель для назначения множественных преподавателей к предмету

## Обзор

Модель `SubjectTeacher` связывает преподавателей с предметами и определяет их роль.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model SubjectTeacher {
  id        String   @id @default(cuid())
  subjectId String
  userId    String
  role      String   // TEACHER, ASSISTANT, CO_TEACHER
  createdAt DateTime @default(now())
  
  subject   Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([subjectId, userId])
  @@map("subject_teachers")
}
```

## Роли преподавателей

- `TEACHER` - Основной преподаватель
- `ASSISTANT` - Ассистент
- `CO_TEACHER` - Со-преподаватель

## Связи

- `subject` - Предмет [[Subject]]
- `user` - Преподаватель [[User]]

## Использование

Заменяет устаревшее поле `Subject.teacherId` и позволяет назначать множество преподавателей на один предмет.

### Пример

```typescript
// Назначить основного преподавателя
await prisma.subjectTeacher.create({
  data: {
    subjectId: 'subject_id',
    userId: 'teacher_id',
    role: 'TEACHER'
  }
})

// Назначить ассистента
await prisma.subjectTeacher.create({
  data: {
    subjectId: 'subject_id',
    userId: 'assistant_id',
    role: 'ASSISTANT'
  }
})
```

---

#model #subject-teacher #relationship #prisma


