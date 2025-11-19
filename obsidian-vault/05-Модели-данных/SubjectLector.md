# SubjectLector (Привязка преподавателя к предмету)

> Модель для назначения множественных преподавателей к предмету

## Обзор

Модель `SubjectLector` связывает преподавателей с предметами и определяет их роль.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model SubjectLector {
  id        String   @id @default(cuid())
  subjectId String
  userId    String
  role      String   // LECTOR, ASSISTANT, CO_LECTOR
  createdAt DateTime @default(now())

  subject   Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  lector    User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([subjectId, userId])
  @@map("subject_lectors")
}
```

## Роли преподавателей

- `LECTOR` - Основной преподаватель
- `ASSISTANT` - Ассистент
- `CO_LECTOR` - Со-преподаватель

## Связи

- `subject` - Предмет [[Subject]]
- `lector` - Преподаватель [[User]]

## Использование

Заменяет устаревшее поле `Subject.lectorId` и позволяет назначать множество преподавателей на один предмет.

### Пример

```typescript
// Назначить основного преподавателя
await prisma.subjectLector.create({
  data: {
    subjectId: 'subject_id',
    userId: 'lector_id',
    role: 'LECTOR'
  }
})

// Назначить ассистента
await prisma.subjectLector.create({
  data: {
    subjectId: 'subject_id',
    userId: 'assistant_id',
    role: 'ASSISTANT'
  }
})
```

---

#model #subject-lector #relationship #prisma


