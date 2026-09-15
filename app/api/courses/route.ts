import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all courses
export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        programStudy: true,
        _count: {
          select: { schedules: true, dosenCourses: true }
        }
      }
    });
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST create new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, title, credits, semester, angkatan, programStudyId } = body;

    if (!code || !title || credits === undefined || semester === undefined || !programStudyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
    }

    const study = await prisma.programStudy.findUnique({ where: { id: String(programStudyId) } });
    if (!study) {
      return NextResponse.json({ error: "Program studi tidak valid" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        code,
        title,
        credits: parseInt(credits),
        semester: parseInt(semester),
        angkatan: angkatan !== undefined && angkatan !== null && angkatan !== "" ? Number(angkatan) : undefined,
        programStudyId: String(programStudyId),
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
