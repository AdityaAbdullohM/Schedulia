import { prisma } from "@/lib/prisma";
import { alertsByRole, metricsByRole, type RoleKey } from "@/lib/mock-data";

export async function getDashboardData(role: RoleKey, userId?: string) {
  try {
    const isLecturerScope = role === "DOSEN";
    const isStudentScope = role === "MAHASISWA";
    const lecturerId = isLecturerScope ? userId : undefined;
    const studentId = isStudentScope ? userId : undefined;
    const student = isStudentScope && studentId
      ? await prisma.user.findUnique({
          where: { id: studentId },
          select: { classGroupId: true },
        })
      : null;
    const scheduleFilter = lecturerId
      ? { lecturerId }
      : student?.classGroupId
        ? { classGroupId: student.classGroupId, enrollments: { some: { studentId, status: "AKTIF" } } }
      : studentId
        ? { enrollments: { some: { studentId, status: "AKTIF" } } }
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
          ? prisma.course.count({ where: { schedules: { some: { enrollments: { some: { studentId, status: "AKTIF" } } } } } })
          : isLecturerScope
            ? 0
            : isStudentScope
              ? 0
              : prisma.course.count(),
      isLecturerScope && lecturerId
        ? prisma.classroom.count({ where: { schedules: { some: { lecturerId } } } })
        : isStudentScope && studentId
          ? prisma.classroom.count({ where: { schedules: { some: { enrollments: { some: { studentId, status: "AKTIF" } } } } } })
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
      courseId: s.courseId,
      lecturerId: s.lecturerId,
      enrollmentId: studentId ? s.enrollments.find((enrollment) => enrollment.studentId === studentId)?.id : undefined,
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

    return {
      stats: [
        { label: "Pengguna", value: String(userCount) },
        { label: "Mata Kuliah", value: String(courseCount) },
        { label: "Ruangan", value: String(roomCount) },
        { label: "Status", value: role },
      ],
      schedules: formattedSchedules.length > 0 ? formattedSchedules : [],
      alerts: alertsByRole[role] || [],
      metrics: metricsByRole[role] || [],
    };
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    // Return minimal data without mock fallback to ensure real counts
    return {
      stats: [
        { label: "Pengguna", value: "0" },
        { label: "Mata Kuliah", value: "0" },
        { label: "Ruangan", value: "0" },
        { label: "Status", value: role },
      ],
      schedules: [],
      alerts: alertsByRole[role] || [],
      metrics: metricsByRole[role] || [],
    };
  }
}
