/*
  Warnings:

  - You are about to drop the column `lectorId` on the `subjects` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "subjects" DROP CONSTRAINT "subjects_lectorId_fkey";

-- AlterTable
ALTER TABLE "bot_settings" ADD COLUMN     "maxBotToken" TEXT,
ADD COLUMN     "maxIsActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxWebhookUrl" TEXT,
ADD COLUMN     "telegramWebhookUrl" TEXT;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "lectorId";

-- CreateTable
CREATE TABLE "max_users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "maxId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "max_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "max_users_userId_key" ON "max_users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "max_users_maxId_key" ON "max_users"("maxId");

-- CreateIndex
CREATE INDEX "attendance_scheduleId_idx" ON "attendance"("scheduleId");

-- CreateIndex
CREATE INDEX "attendance_userId_idx" ON "attendance"("userId");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX "attendance_markedAt_idx" ON "attendance"("markedAt");

-- CreateIndex
CREATE INDEX "exam_results_examId_idx" ON "exam_results"("examId");

-- CreateIndex
CREATE INDEX "exam_results_userId_idx" ON "exam_results"("userId");

-- CreateIndex
CREATE INDEX "exam_results_status_idx" ON "exam_results"("status");

-- CreateIndex
CREATE INDEX "exam_results_takenAt_idx" ON "exam_results"("takenAt");

-- CreateIndex
CREATE INDEX "exams_subjectId_idx" ON "exams"("subjectId");

-- CreateIndex
CREATE INDEX "exams_groupId_idx" ON "exams"("groupId");

-- CreateIndex
CREATE INDEX "exams_date_idx" ON "exams"("date");

-- CreateIndex
CREATE INDEX "exams_type_idx" ON "exams"("type");

-- CreateIndex
CREATE INDEX "exams_isActive_idx" ON "exams"("isActive");

-- CreateIndex
CREATE INDEX "external_resources_subjectId_idx" ON "external_resources"("subjectId");

-- CreateIndex
CREATE INDEX "external_resources_scheduleId_idx" ON "external_resources"("scheduleId");

-- CreateIndex
CREATE INDEX "external_resources_type_idx" ON "external_resources"("type");

-- CreateIndex
CREATE INDEX "external_resources_isActive_idx" ON "external_resources"("isActive");

-- CreateIndex
CREATE INDEX "forum_posts_topicId_idx" ON "forum_posts"("topicId");

-- CreateIndex
CREATE INDEX "forum_posts_authorId_idx" ON "forum_posts"("authorId");

-- CreateIndex
CREATE INDEX "forum_posts_createdAt_idx" ON "forum_posts"("createdAt");

-- CreateIndex
CREATE INDEX "forum_topics_subjectId_idx" ON "forum_topics"("subjectId");

-- CreateIndex
CREATE INDEX "forum_topics_groupId_idx" ON "forum_topics"("groupId");

-- CreateIndex
CREATE INDEX "forum_topics_authorId_idx" ON "forum_topics"("authorId");

-- CreateIndex
CREATE INDEX "forum_topics_isPinned_idx" ON "forum_topics"("isPinned");

-- CreateIndex
CREATE INDEX "forum_topics_isClosed_idx" ON "forum_topics"("isClosed");

-- CreateIndex
CREATE INDEX "forum_topics_createdAt_idx" ON "forum_topics"("createdAt");

-- CreateIndex
CREATE INDEX "groups_isActive_idx" ON "groups"("isActive");

-- CreateIndex
CREATE INDEX "groups_year_idx" ON "groups"("year");

-- CreateIndex
CREATE INDEX "groups_semester_idx" ON "groups"("semester");

-- CreateIndex
CREATE INDEX "homework_subjectId_idx" ON "homework"("subjectId");

-- CreateIndex
CREATE INDEX "homework_groupId_idx" ON "homework"("groupId");

-- CreateIndex
CREATE INDEX "homework_deadline_idx" ON "homework"("deadline");

-- CreateIndex
CREATE INDEX "homework_isActive_idx" ON "homework"("isActive");

-- CreateIndex
CREATE INDEX "homework_submissions_userId_idx" ON "homework_submissions"("userId");

-- CreateIndex
CREATE INDEX "homework_submissions_homeworkId_idx" ON "homework_submissions"("homeworkId");

-- CreateIndex
CREATE INDEX "homework_submissions_status_idx" ON "homework_submissions"("status");

-- CreateIndex
CREATE INDEX "homework_submissions_submittedAt_idx" ON "homework_submissions"("submittedAt");

-- CreateIndex
CREATE INDEX "homework_submissions_reviewedAt_idx" ON "homework_submissions"("reviewedAt");

-- CreateIndex
CREATE INDEX "mentor_meetings_mentorId_idx" ON "mentor_meetings"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_meetings_studentId_idx" ON "mentor_meetings"("studentId");

-- CreateIndex
CREATE INDEX "mentor_meetings_scheduledAt_idx" ON "mentor_meetings"("scheduledAt");

-- CreateIndex
CREATE INDEX "mentor_meetings_status_idx" ON "mentor_meetings"("status");

-- CreateIndex
CREATE INDEX "schedules_subjectId_idx" ON "schedules"("subjectId");

-- CreateIndex
CREATE INDEX "schedules_groupId_idx" ON "schedules"("groupId");

-- CreateIndex
CREATE INDEX "schedules_subgroupId_idx" ON "schedules"("subgroupId");

-- CreateIndex
CREATE INDEX "schedules_date_idx" ON "schedules"("date");

-- CreateIndex
CREATE INDEX "schedules_dayOfWeek_idx" ON "schedules"("dayOfWeek");

-- CreateIndex
CREATE INDEX "schedules_isActive_idx" ON "schedules"("isActive");

-- CreateIndex
CREATE INDEX "subgroup_students_subgroupId_idx" ON "subgroup_students"("subgroupId");

-- CreateIndex
CREATE INDEX "subgroup_students_userId_idx" ON "subgroup_students"("userId");

-- CreateIndex
CREATE INDEX "subgroups_groupId_idx" ON "subgroups"("groupId");

-- CreateIndex
CREATE INDEX "subgroups_subjectId_idx" ON "subgroups"("subjectId");

-- CreateIndex
CREATE INDEX "subgroups_isActive_idx" ON "subgroups"("isActive");

-- CreateIndex
CREATE INDEX "subject_documents_subjectId_idx" ON "subject_documents"("subjectId");

-- CreateIndex
CREATE INDEX "subject_documents_type_idx" ON "subject_documents"("type");

-- CreateIndex
CREATE INDEX "subject_documents_isActive_idx" ON "subject_documents"("isActive");

-- CreateIndex
CREATE INDEX "subject_lectors_subjectId_idx" ON "subject_lectors"("subjectId");

-- CreateIndex
CREATE INDEX "subject_lectors_userId_idx" ON "subject_lectors"("userId");

-- CreateIndex
CREATE INDEX "subject_lectors_role_idx" ON "subject_lectors"("role");

-- CreateIndex
CREATE INDEX "subjects_isActive_idx" ON "subjects"("isActive");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_groupId_idx" ON "users"("groupId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- AddForeignKey
ALTER TABLE "max_users" ADD CONSTRAINT "max_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
