import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET single course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        programStudy: true,
        _count: {
          select: { schedules: true, dosenCourses: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// PUT update course
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, title, credits, semester, angkatan, programStudyId } = body;

    const existingCourse = await prisma.course.findUnique({
      where: { id }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (code && code !== existingCourse.code) {
      const duplicateCode = await prisma.course.findUnique({
        where: { code }
      });
      if (duplicateCode) {
        return NextResponse.json({ error: "Course code already exists" }, { status: 400 });
      }
    }

    if (programStudyId) {
      const study = await prisma.programStudy.findUnique({ where: { id: String(programStudyId) } });
      if (!study) {
        return NextResponse.json({ error: "Program studi tidak valid" }, { status: 400 });
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(title && { title }),
        ...(credits !== undefined && { credits: parseInt(credits) }),
        ...(semester !== undefined && { semester: parseInt(semester) }),
        ...(angkatan !== undefined && angkatan !== null && angkatan !== "" ? { angkatan: Number(angkatan) } : angkatan === "" ? { angkatan: null } : {}),
        ...(programStudyId && { programStudyId: String(programStudyId) })
      }
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { schedules: true }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Prevent deletion if course has active schedules
    if (course._count.schedules > 0) {
      return NextResponse.json(
        { error: "Cannot delete course with active schedules" },
        { status: 400 }
      );
    }

    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
