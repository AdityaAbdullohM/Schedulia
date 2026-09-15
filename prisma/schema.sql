-- Create Role enum type
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOSEN', 'MAHASISWA');

-- Create User table
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "nip" TEXT UNIQUE,
  "nim" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Course table
CREATE TABLE "Course" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "semester" INTEGER NOT NULL,
  "department" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Classroom table
CREATE TABLE "Classroom" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "capacity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create ClassSchedule table
CREATE TABLE "ClassSchedule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "lecturerId" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "semester" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ClassSchedule_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ClassSchedule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Enrollment table
CREATE TABLE "Enrollment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL,
  "classScheduleId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AKTIF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_classScheduleId_fkey" FOREIGN KEY ("classScheduleId") REFERENCES "ClassSchedule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Enrollment_studentId_classScheduleId_key" UNIQUE("studentId", "classScheduleId")
);

-- Create indexes for better query performance
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_nip_idx" ON "User"("nip");
CREATE INDEX "User_nim_idx" ON "User"("nim");
CREATE INDEX "Course_code_idx" ON "Course"("code");
CREATE INDEX "Classroom_name_idx" ON "Classroom"("name");
CREATE INDEX "ClassSchedule_courseId_idx" ON "ClassSchedule"("courseId");
CREATE INDEX "ClassSchedule_lecturerId_idx" ON "ClassSchedule"("lecturerId");
CREATE INDEX "ClassSchedule_classroomId_idx" ON "ClassSchedule"("classroomId");
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");
CREATE INDEX "Enrollment_classScheduleId_idx" ON "Enrollment"("classScheduleId");

-- Insert seed data
-- Admin user
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "nip") 
VALUES ('admin-001', 'Admin Schedulia', 'admin@schedulia.local', '$2a$10$N9qo8uLOickgx2ZMRZoMye', 'ADMIN', 'NIP001');

-- Sample courses
INSERT INTO "Course" ("id", "code", "title", "credits", "semester", "department") 
VALUES
  ('course-001', 'MK001', 'Pemrograman Web', 3, 1, 'Teknik Informatika'),
  ('course-002', 'MK002', 'Database Design', 3, 2, 'Teknik Informatika'),
  ('course-003', 'MK003', 'UI/UX Design', 2, 1, 'Teknik Informatika');

-- Sample classrooms
INSERT INTO "Classroom" ("id", "name", "capacity") 
VALUES
  ('room-001', 'Ruang 101', 30),
  ('room-002', 'Ruang 102', 40),
  ('room-003', 'Lab Komputer A', 20);
