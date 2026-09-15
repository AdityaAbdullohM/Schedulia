import { prisma } from "@/lib/prisma";
import { alertsByRole, metricsByRole } from "@/lib/mock-data";
import { NextRequest, NextResponse } from "next/server";

type RoleKey = "ADMIN" | "DOSEN" | "MAHASISWA";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = (searchParams.get("role") || "ADMIN").toUpperCase() as RoleKey;
    const userId = searchParams.get("userId") || undefined;
    const isLecturerScope = role === "DOSEN";
    const isStudentScope = role === "MAHASISWA";
    const lecturerId = isLecturerScope ? userId : undefined;
    const studentId = isStudentScope ? userId : undefined;
    const scheduleFilter = lecturerId
      ? { lecturerId }
      : studentId
        ? { enrollments: { some: { studentId } } }
        : isLecturerScope
          ? { lecturerId: "__NONE__" }
          : isStudentScope
            ? { enrollments: { some: { studentId: "__NONE__" } } }
            : {};

    const [userCount, courseCount, roomCount, schedules] = await Promise.all([
      isLecturerScope && lecturerId
        ? prisma.user.count({ where: { role: "DOSEN", id: lecturerId } })
        : isStudentScope && studentId
          ? prisma.user.count({ where: { role: "MAHASISWA", id: studentId } })
          : isLecturerScope
            ? 0
            : isStudentScope
              ? 0
              : prisma.user.count(),
      isLecturerScope && lecturerId
        ? prisma.course.count({ where: { dosenCourses: { some: { dosenId: lecturerId } } } })
        : isStudentScope && studentId
          ? prisma.course.count({ where: { schedules: { some: { enrollments: { some: { studentId } } } } } })
          : isLecturerScope
            ? 0
            : isStudentScope
              ? 0
              : prisma.course.count(),
      isLecturerScope && lecturerId
        ? prisma.classroom.count({ where: { schedules: { some: { lecturerId } } } })
        : isStudentScope && studentId
          ? prisma.classroom.count({ where: { schedules: { some: { enrollments: { some: { studentId } } } } } })
          : isLecturerScope
            ? 0
            : isStudentScope
              ? 0
              : prisma.classroom.count(),
      prisma.classSchedule.findMany({
        where: scheduleFilter,
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { title: true } },
          lecturer: { select: { name: true } },
          classroom: { select: { name: true } },
          enrollments: {
            include: {
              student: { select: { id: true, name: true, nim: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
    ]);

    const formattedSchedules = schedules.map((s) => ({
      id: s.id,
      day: s.day,
      time: `${s.startTime} - ${s.endTime}`,
      course: s.course.title,
      room: s.classroom.name,
      lecturer: s.lecturer.name,
      semester: s.semester,
      students: undefined,
      enrolledStudents: s.enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        id: enrollment.student.id,
        name: enrollment.student.name,
        nim: enrollment.student.nim,
        status: enrollment.status,
      })),
    }));

    return NextResponse.json({
      stats: [
        { label: "Pengguna", value: String(userCount) },
        { label: "Mata Kuliah", value: String(courseCount) },
        { label: "Ruangan", value: String(roomCount) },
        { label: "Status", value: role },
      ],
      schedules: formattedSchedules,
      alerts: alertsByRole[role] || [],
      metrics: metricsByRole[role] || [],
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    // Return error response with real data attempt
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
