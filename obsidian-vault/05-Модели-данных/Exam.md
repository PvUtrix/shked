# Exam (Экзамен)

> Модель для управления экзаменами и зачетами

## Обзор

Модель `Exam` хранит информацию об экзаменах, зачетах и дифференцированных зачетах.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model Exam {
  id          String   @id @default(cuid())
  subjectId   String
  groupId     String
  type        String   // EXAM, CREDIT, DIFF_CREDIT
  format      String   // ORAL, WRITTEN, MIXED
  date        DateTime
  location    String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  group       Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  results     ExamResult[]
  
  @@map("exams")
}
```

## Типы

- `EXAM` - Экзамен
- `CREDIT` - Зачет
- `DIFF_CREDIT` - Дифференцированный зачет

## Форматы

- `ORAL` - Устный
- `WRITTEN` - Письменный
- `MIXED` - Смешанный

## Связи

- `subject` - Предмет [[Subject]]
- `group` - Группа [[Group]]
- `results` - Результаты [[ExamResult]]

## API

См. [docs/features/EXAM_MANAGEMENT.md](../../docs/features/EXAM_MANAGEMENT.md)

**Endpoints**:
- `GET /api/exams`
- `POST /api/exams`
- `PATCH /api/exams/{id}`
- `DELETE /api/exams/{id}`

---

#model #exam #assessment #prisma


