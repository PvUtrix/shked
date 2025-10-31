# ExamResult (Результат экзамена)

> Модель для хранения результатов экзаменов студентов

## Обзор

Модель `ExamResult` хранит результаты прохождения экзаменов/зачетов студентами.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model ExamResult {
  id         String    @id @default(cuid())
  examId     String
  userId     String
  grade      String?   // 5, 4, 3, 2, ЗАЧЕТ, НЕ ЗАЧЕТ
  status     String    @default("NOT_TAKEN") // NOT_TAKEN, PASSED, FAILED
  notes      String?
  takenAt    DateTime?
  recordedBy String
  createdAt  DateTime  @default(now())
  
  exam       Exam      @relation(fields: [examId], references: [id], onDelete: Cascade)
  student    User      @relation("ExamStudent", fields: [userId], references: [id])
  recorder   User      @relation("ExamRecorder", fields: [recordedBy], references: [id])
  
  @@unique([examId, userId])
  @@map("exam_results")
}
```

## Статусы

- `NOT_TAKEN` - Не сдавал
- `PASSED` - Сдал
- `FAILED` - Не сдал

## Оценки

**Экзамены**: "5", "4", "3", "2"  
**Зачеты**: "ЗАЧЕТ", "НЕ ЗАЧЕТ"

## Связи

- `exam` - Экзамен [[Exam]]
- `student` - Студент [[User]]
- `recorder` - Преподаватель [[User]]

## API

**Endpoints**:
- `POST /api/exams/{examId}/results`
- `GET /api/exams/{examId}/results`

---

#model #exam-result #assessment #prisma


