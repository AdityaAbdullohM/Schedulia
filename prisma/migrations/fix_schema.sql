-- Run this in Supabase SQL Editor to align an existing database with schema.prisma.
-- This script is idempotent and does not remove existing data.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'Role' AND n.nspname = 'public'
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "classGroupId" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "programStudyId" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'Aktif';

ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "programStudyId" TEXT;

ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "department" TEXT;

ALTER TABLE "Course"
  ALTER COLUMN "department" DROP NOT NULL;

ALTER TABLE "Course"
  ALTER COLUMN "department" SET DEFAULT 'Umum';

ALTER TABLE "ClassSchedule"
  ADD COLUMN IF NOT EXISTS "classGroupId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClassGroup_programStudyId_fkey'
  ) THEN
    ALTER TABLE "ClassGroup"
      ADD CONSTRAINT "ClassGroup_programStudyId_fkey"
      FOREIGN KEY ("programStudyId") REFERENCES "ProgramStudy"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_classGroupId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_classGroupId_fkey"
      FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_programStudyId_fkey'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_programStudyId_fkey"
      FOREIGN KEY ("programStudyId") REFERENCES "ProgramStudy"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Course_programStudyId_fkey'
  ) THEN
    ALTER TABLE "Course"
      ADD CONSTRAINT "Course_programStudyId_fkey"
      FOREIGN KEY ("programStudyId") REFERENCES "ProgramStudy"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ClassSchedule_classGroupId_fkey'
  ) THEN
    ALTER TABLE "ClassSchedule"
      ADD CONSTRAINT "ClassSchedule_classGroupId_fkey"
      FOREIGN KEY ("classGroupId") REFERENCES "ClassGroup"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "DosenCourse" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dosenId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DosenCourse_dosenId_fkey'
  ) THEN
    ALTER TABLE "DosenCourse"
      ADD CONSTRAINT "DosenCourse_dosenId_fkey"
      FOREIGN KEY ("dosenId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DosenCourse_courseId_fkey'
  ) THEN
    ALTER TABLE "DosenCourse"
      ADD CONSTRAINT "DosenCourse_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "DosenCourse_dosenId_courseId_key"
  ON "DosenCourse"("dosenId", "courseId");

CREATE INDEX IF NOT EXISTS "ClassGroup_programStudyId_idx"
  ON "ClassGroup"("programStudyId");

CREATE INDEX IF NOT EXISTS "Course_programStudyId_idx"
  ON "Course"("programStudyId");

CREATE INDEX IF NOT EXISTS "ClassSchedule_classGroupId_idx"
  ON "ClassSchedule"("classGroupId");