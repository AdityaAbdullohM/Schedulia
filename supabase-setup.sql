-- Schedulia database setup for Supabase SQL Editor.
-- Run this entire file once in Supabase SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'Role'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOSEN', 'MAHASISWA');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProgramStudy" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL UNIQUE,
  "degree" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ClassGroup" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "cohort" TEXT NOT NULL,
  "programStudyId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassGroup_programStudyId_fkey"
    FOREIGN KEY ("programStudyId") REFERENCES "ProgramStudy"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Course" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "semester" INTEGER NOT NULL,
  "angkatan" INTEGER,
  "department" TEXT,
  "programStudyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Course_programStudyId_fkey"
    FOREIGN KEY ("programStudyId") REFERENCES "ProgramStudy"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Classroom" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "capacity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "nip" TEXT UNIQUE,
  "nim" TEXT UNIQUE,
  "angkatan" INTEGER,
  "classGroupId" TEXT,
  "programStudyId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Aktif',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_classGroupId_fkey"
    FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "User_programStudyId_fkey"
    FOREIGN KEY ("programStudyId") REFERENCES "ProgramStudy"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ClassSchedule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "lecturerId" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "classGroupId" TEXT,
  "day" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassSchedule_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ClassSchedule_lecturerId_fkey"
    FOREIGN KEY ("lecturerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ClassSchedule_classroomId_fkey"
    FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ClassSchedule_classGroupId_fkey"
    FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Enrollment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "classScheduleId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AKTIF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Enrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_classScheduleId_fkey"
    FOREIGN KEY ("classScheduleId") REFERENCES "ClassSchedule"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_studentId_classScheduleId_key"
    UNIQUE ("studentId", "classScheduleId")
);

CREATE TABLE IF NOT EXISTS "DosenCourse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dosenId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DosenCourse_dosenId_fkey"
    FOREIGN KEY ("dosenId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DosenCourse_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DosenCourse_dosenId_courseId_key"
    UNIQUE ("dosenId", "courseId")
);

CREATE TABLE IF NOT EXISTS "Attendance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enrollmentId" TEXT NOT NULL,
  "meeting" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attendance_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Attendance_enrollmentId_meeting_key"
    UNIQUE ("enrollmentId", "meeting")
);

CREATE TABLE IF NOT EXISTS "Announcement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "classScheduleId" TEXT NOT NULL,
  "lecturerId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Announcement_classScheduleId_fkey"
    FOREIGN KEY ("classScheduleId") REFERENCES "ClassSchedule"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Announcement_lecturerId_fkey"
    FOREIGN KEY ("lecturerId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AnnouncementReply" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "announcementId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnnouncementReply_announcementId_fkey"
    FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AnnouncementReply_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_nip_idx" ON "User"("nip");
CREATE INDEX IF NOT EXISTS "User_nim_idx" ON "User"("nim");
CREATE INDEX IF NOT EXISTS "Course_code_idx" ON "Course"("code");
CREATE INDEX IF NOT EXISTS "Course_programStudyId_idx" ON "Course"("programStudyId");
CREATE INDEX IF NOT EXISTS "ClassGroup_programStudyId_idx" ON "ClassGroup"("programStudyId");
CREATE INDEX IF NOT EXISTS "Classroom_name_idx" ON "Classroom"("name");
CREATE INDEX IF NOT EXISTS "ClassSchedule_courseId_idx" ON "ClassSchedule"("courseId");
CREATE INDEX IF NOT EXISTS "ClassSchedule_lecturerId_idx" ON "ClassSchedule"("lecturerId");
CREATE INDEX IF NOT EXISTS "ClassSchedule_classGroupId_idx" ON "ClassSchedule"("classGroupId");
CREATE INDEX IF NOT EXISTS "Enrollment_studentId_idx" ON "Enrollment"("studentId");
CREATE INDEX IF NOT EXISTS "Enrollment_classScheduleId_idx" ON "Enrollment"("classScheduleId");
CREATE INDEX IF NOT EXISTS "Attendance_enrollmentId_idx" ON "Attendance"("enrollmentId");
CREATE INDEX IF NOT EXISTS "Announcement_classScheduleId_idx" ON "Announcement"("classScheduleId");
CREATE INDEX IF NOT EXISTS "AnnouncementReply_announcementId_idx" ON "AnnouncementReply"("announcementId");
CREATE INDEX IF NOT EXISTS "AnnouncementReply_studentId_idx" ON "AnnouncementReply"("studentId");

INSERT INTO "User" (
  "id", "name", "email", "passwordHash", "role", "nip", "createdAt", "updatedAt"
)
VALUES
  ('admin-schedulia-001', 'Budi Santoso', 'admin@schedulia.id', 'cGFzc3dvcmQxMjM=', 'ADMIN', '198506152010121001', NOW(), NOW()),
  ('admin-schedulia-002', 'Siti Rahmawati', 'admin.siti@schedulia.id', 'YWRtaW5QYXNzNDU2', 'ADMIN', '198712302012101002', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = EXCLUDED."role",
  "nip" = EXCLUDED."nip",
  "updatedAt" = NOW();

INSERT INTO "ProgramStudy" ("id", "code", "name", "degree")
VALUES ('prodi-ti', 'TI', 'Teknik Informatika', 'S1')
ON CONFLICT DO NOTHING;

INSERT INTO "Course" ("id", "code", "title", "credits", "semester", "department", "programStudyId")
VALUES
  ('course-001', 'MK001', 'Pemrograman Web', 3, 1, 'Teknik Informatika', 'prodi-ti'),
  ('course-002', 'MK002', 'Database Design', 3, 2, 'Teknik Informatika', 'prodi-ti'),
  ('course-003', 'MK003', 'UI/UX Design', 2, 1, 'Teknik Informatika', 'prodi-ti')
ON CONFLICT DO NOTHING;

INSERT INTO "Classroom" ("id", "name", "capacity")
VALUES
  ('room-001', 'Ruang 101', 30),
  ('room-002', 'Ruang 102', 40),
  ('room-003', 'Lab Komputer A', 20)
ON CONFLICT DO NOTHING;

SELECT "id", "name", "email", "role" FROM "User" WHERE "role" = 'ADMIN';