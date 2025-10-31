# SubjectDocument (Документ предмета)

> Модель для хранения документов предмета (РПД, аннотации и т.д.)

## Обзор

Модель `SubjectDocument` хранит загруженные документы, связанные с предметами.

**Файл**: `prisma/schema.prisma`

## Схема данных

```prisma
model SubjectDocument {
  id           String   @id @default(cuid())
  subjectId    String
  type         String   // RPD, ANNOTATION, SYLLABUS, MATERIALS, OTHER
  filename     String
  originalName String
  fileSize     Int
  mimeType     String
  url          String
  description  String?
  uploadedBy   String
  uploadedAt   DateTime @default(now())
  
  subject      Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  uploader     User     @relation(fields: [uploadedBy], references: [id])
  
  @@map("subject_documents")
}
```

## Типы документов

- `RPD` - Рабочая программа дисциплины
- `ANNOTATION` - Аннотация предмета
- `SYLLABUS` - Учебный план
- `MATERIALS` - Учебные материалы
- `OTHER` - Другие документы

## Связи

- `subject` - Предмет [[Subject]]
- `uploader` - Загрузивший пользователь [[User]]

## API

См. [docs/features/DOCUMENTS_RESOURCES.md](../../docs/features/DOCUMENTS_RESOURCES.md)

**Endpoints**:
- `GET /api/subjects/{subjectId}/documents`
- `POST /api/subjects/{subjectId}/documents`
- `DELETE /api/subjects/{subjectId}/documents/{docId}`

---

#model #document #subject #prisma


