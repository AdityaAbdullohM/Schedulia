-- CreateTable DosenCourse
CREATE TABLE "DosenCourse" (
    "id" TEXT NOT NULL,
    "dosenId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DosenCourse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DosenCourse_dosenId_courseId_key" ON "DosenCourse"("dosenId", "courseId");

-- AddForeignKey
ALTER TABLE "DosenCourse" ADD CONSTRAINT "DosenCourse_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosenCourse" ADD CONSTRAINT "DosenCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
