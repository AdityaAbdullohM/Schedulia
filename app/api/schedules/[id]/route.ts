import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const rawCourseId = body.course ?? body.courseId;
    const rawRoomId = body.room ?? body.classroomId;
    const rawLecturerId = body.lecturer ?? body.lecturerId;
    const rawClassGroupId = body.classGroup ?? body.classGroupId;
    let startTime = body.startTime;
    let endTime = body.endTime;

    if ((!startTime || !endTime) && typeof body.time === "string") {
      const timeMatch = body.time.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i);
      if (timeMatch) {
        startTime = timeMatch[1];
        endTime = timeMatch[2];
      }
    }

    const { day, semester } = body;

    if (!day || !startTime || !endTime || !rawCourseId || !rawRoomId || !rawLecturerId || !semester) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const assignment = await prisma.dosenCourse.findUnique({
      where: { dosenId_courseId: { dosenId: rawLecturerId, courseId: rawCourseId } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Dosen tidak mengampu mata kuliah yang dipilih" }, { status: 409 });
    }

    const existingLecturerSchedule = await prisma.classSchedule.findFirst({
      where: { lecturerId: rawLecturerId, id: { not: id } },
    });
    if (existingLecturerSchedule) {
      return NextResponse.json({ error: "Dosen ini sudah memiliki jadwal dan tidak dapat mengajar di hari lain" }, { status: 409 });
    }

    const schedule = await prisma.classSchedule.update({
      where: { id },
      data: {
        day,
        startTime,
        endTime,
        courseId: rawCourseId,
        classroomId: rawRoomId,
        lecturerId: rawLecturerId,
        classGroupId: rawClassGroupId || null,
        semester,
      },
      include: {
        course: { select: { title: true } },
        lecturer: { select: { name: true } },
        classroom: { select: { name: true } },
        classGroup: { select: { code: true, name: true } },
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

// DELETE schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.classSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
