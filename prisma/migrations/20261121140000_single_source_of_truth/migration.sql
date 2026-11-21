-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "externalKey" TEXT,
ADD COLUMN     "meetingUrl" TEXT,
ADD COLUMN     "semesterId" TEXT,
ADD COLUMN     "sourceAt" TIMESTAMP(3),
ADD COLUMN     "sourceRef" TEXT,
ADD COLUMN     "sourceType" TEXT;

-- AlterTable
ALTER TABLE "subgroups" ADD COLUMN     "instructor" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "calendarToken" TEXT;

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "startsOn" TIMESTAMP(3),
    "endsOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deadlines" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "semesterId" TEXT,
    "subjectId" TEXT,
    "subgroupId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'HOMEWORK',
    "number" INTEGER,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "submissionChannel" TEXT,
    "submissionTarget" TEXT,
    "namingRule" TEXT,
    "links" JSONB,
    "homeworkId" TEXT,
    "externalKey" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceRef" TEXT,
    "sourceAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "subjectId" TEXT,
    "subgroupId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" JSONB,
    "scheduleId" TEXT,
    "deadlineId" TEXT,
    "importId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'MANUAL',
    "sourceRef" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_imports" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "importedById" TEXT,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timetable_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "semesters_groupId_number_key" ON "semesters"("groupId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "deadlines_externalKey_key" ON "deadlines"("externalKey");

-- CreateIndex
CREATE INDEX "deadlines_groupId_idx" ON "deadlines"("groupId");

-- CreateIndex
CREATE INDEX "deadlines_dueAt_idx" ON "deadlines"("dueAt");

-- CreateIndex
CREATE INDEX "deadlines_subjectId_idx" ON "deadlines"("subjectId");

-- CreateIndex
CREATE INDEX "deadlines_isActive_idx" ON "deadlines"("isActive");

-- CreateIndex
CREATE INDEX "announcements_groupId_createdAt_idx" ON "announcements"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "timetable_imports_groupId_createdAt_idx" ON "timetable_imports"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_externalKey_key" ON "schedules"("externalKey");

-- CreateIndex
CREATE UNIQUE INDEX "users_calendarToken_key" ON "users"("calendarToken");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "subgroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "homework"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "subgroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "deadlines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_importId_fkey" FOREIGN KEY ("importId") REFERENCES "timetable_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_imports" ADD CONSTRAINT "timetable_imports_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_imports" ADD CONSTRAINT "timetable_imports_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_imports" ADD CONSTRAINT "timetable_imports_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

