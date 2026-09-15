import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all dosen with their courses
export async function GET(request: NextRequest) {
  try {
    const dosen = await prisma.user.findMany({
      where: { role: "DOSEN" },
      include: {
        dosenCourses: {
          include: { course: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(dosen);
  } catch (error) {
    console.error("Error fetching dosen:", error);
    return NextResponse.json({ error: "Failed to fetch dosen" }, { status: 500 });
  }
}

// POST assign course to dosen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dosenId, courseIds } = body;

    if (!dosenId || !courseIds || !Array.isArray(courseIds)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Delete existing course assignments for this dosen
    await prisma.dosenCourse.deleteMany({
      where: { dosenId }
    });

    // Create new course assignments
    const dosenCourses = await Promise.all(
      courseIds.map(courseId =>
        prisma.dosenCourse.create({
          data: {
            dosenId,
            courseId
          }
        })
      )
    );

    return NextResponse.json({ success: true, dosenCourses }, { status: 201 });
  } catch (error) {
    console.error("Error assigning courses to dosen:", error);
    return NextResponse.json({ error: "Failed to assign courses" }, { status: 500 });
  }
}
