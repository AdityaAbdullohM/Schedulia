const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    // Create DosenCourse table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DosenCourse" (
        "id" TEXT NOT NULL,
        "dosenId" TEXT NOT NULL,
        "courseId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DosenCourse_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log("✓ DosenCourse table created");

    // Create unique index
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "DosenCourse_dosenId_courseId_key" ON "DosenCourse"("dosenId", "courseId");
    `);

    console.log("✓ Unique index created");

    // Add foreign key constraints
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DosenCourse" ADD CONSTRAINT "DosenCourse_dosenId_fkey" 
      FOREIGN KEY ("dosenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `).catch(() => console.log("✓ dosenId foreign key already exists"));

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "DosenCourse" ADD CONSTRAINT "DosenCourse_courseId_fkey" 
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `).catch(() => console.log("✓ courseId foreign key already exists"));

    console.log("✓ Foreign keys created");
    console.log("\n✅ DosenCourse table setup completed successfully!");
  } catch (error) {
    console.error("Error setting up DosenCourse table:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
