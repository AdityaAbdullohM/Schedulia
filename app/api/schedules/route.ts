import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all schedules
export async function GET(request: NextRequest) {
  try {
    const schedules = await prisma.classSchedule.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { title: true, code: true },
        },
        lecturer: {
          select: { name: true, nip: true },
        },
        classroom: {
          select: { name: true },
        },
        classGroup: {
          select: {
            code: true,
            name: true,
            cohort: true,
            programStudy: {
              select: { name: true },
            },
          },
        },
      },
    });

    const formatted = schedules.map((s) => ({
      id: s.id,
      day: s.day,
      time: `${s.startTime} - ${s.endTime}`,
      course: s.course.title,
      room: s.classroom.name,
      lecturer: s.lecturer.name,
      classGroup: s.classGroup ? `${s.classGroup.code} - ${s.classGroup.name}` : "-",
      programStudy: s.classGroup?.programStudy?.name || "-",
      angkatan: s.classGroup?.cohort || "-",
      semester: s.semester,
      courseId: s.courseId,
      classroomId: s.classroomId,
      lecturerId: s.lecturerId,
      classGroupId: s.classGroupId,
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
}

// POST create new schedule
export async function POST(request: NextRequest) {
  try {
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
      where: { lecturerId: rawLecturerId },
    });
    if (existingLecturerSchedule) {
      return NextResponse.json({ error: "Dosen ini sudah memiliki jadwal dan tidak dapat mengajar di hari lain" }, { status: 409 });
    }

    const schedule = await prisma.classSchedule.create({
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

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}
