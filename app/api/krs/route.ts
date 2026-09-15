import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const role = (request.nextUrl.searchParams.get("role") || "MAHASISWA").toUpperCase();
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ availableSchedules: [], myEnrollments: [], requests: [] });
    }

    if (role === "MAHASISWA") {
      const student = await prisma.user.findUnique({
        where: { id: userId },
        select: { classGroupId: true, angkatan: true },
      });

      const allSchedules = await prisma.classSchedule.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true, code: true } },
          lecturer: { select: { id: true, name: true } },
          classroom: { select: { id: true, name: true } },
          classGroup: { select: { id: true, code: true, name: true, cohort: true } },
        },
      });

      const myEnrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        include: {
          classSchedule: {
            include: {
              course: { select: { id: true, title: true, code: true } },
              lecturer: { select: { id: true, name: true } },
              classroom: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const availableSchedules = allSchedules
        .filter((schedule) => {
          const matchesClassGroup = !student?.classGroupId || schedule.classGroupId === student.classGroupId;
          const matchesAngkatan = student?.angkatan !== null && student?.angkatan !== undefined
            && schedule.classGroup?.cohort === String(student.angkatan);
          const existingEnrollment = myEnrollments.find(
            (enrollment) => enrollment.classScheduleId === schedule.id
          );
          const canBeSelected = !existingEnrollment || existingEnrollment.status === "DITOLAK";

          return matchesClassGroup && matchesAngkatan && canBeSelected;
        })
        .map((schedule) => ({
          ...schedule,
          alreadySelected: myEnrollments.some((enrollment) => enrollment.classScheduleId === schedule.id),
        }));

      return NextResponse.json({
        availableSchedules,
        myEnrollments: myEnrollments.map((enrollment) => ({
          id: enrollment.id,
          status: enrollment.status,
          student: {
            id: enrollment.studentId,
            name: "",
            nim: null,
          },
          classSchedule: {
            id: enrollment.classSchedule.id,
            day: enrollment.classSchedule.day,
            startTime: enrollment.classSchedule.startTime,
            endTime: enrollment.classSchedule.endTime,
            semester: enrollment.classSchedule.semester,
            course: enrollment.classSchedule.course,
            lecturer: enrollment.classSchedule.lecturer,
            classroom: enrollment.classSchedule.classroom,
          },
        })),
      });
    }

    if (role === "DOSEN") {
      const requests = await prisma.enrollment.findMany({
        where: {
          classSchedule: {
            lecturerId: userId,
          },
        },
        include: {
          student: { select: { id: true, name: true, nim: true } },
          classSchedule: {
            include: {
              course: { select: { id: true, title: true, code: true } },
              lecturer: { select: { id: true, name: true } },
              classroom: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ requests });
    }

    return NextResponse.json({ availableSchedules: [], myEnrollments: [], requests: [] });
  } catch (error) {
    console.error("Error loading KRS:", error);
    return NextResponse.json({ error: "Failed to load KRS" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scheduleIds } = body;

    if (!userId || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return NextResponse.json({ error: "Data KRS tidak lengkap" }, { status: 400 });
    }

    const existing = await prisma.enrollment.findMany({
      where: {
        studentId: userId,
        classScheduleId: { in: scheduleIds },
      },
    });

    const activeOrPending = existing.filter(
      (enrollment) => enrollment.status === "AKTIF" || enrollment.status === "PENDING"
    );

    if (activeOrPending.length > 0) {
      return NextResponse.json({ error: "Beberapa mata kuliah sudah dipilih" }, { status: 409 });
    }

    const rejectedEnrollments = existing.filter((enrollment) => enrollment.status === "DITOLAK");
    await Promise.all(
      rejectedEnrollments.map((enrollment) =>
        prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "PENDING" },
        })
      )
    );

    const existingScheduleIds = new Set(existing.map((enrollment) => enrollment.classScheduleId));
    const created = await Promise.all(
      scheduleIds.filter((scheduleId: string) => !existingScheduleIds.has(scheduleId)).map((scheduleId: string) =>
        prisma.enrollment.create({
          data: {
            studentId: userId,
            classScheduleId: scheduleId,
            status: "PENDING",
          },
        })
      )
    );

    return NextResponse.json({ success: true, created }, { status: 201 });
  } catch (error) {
    console.error("Error creating KRS:", error);
    return NextResponse.json({ error: "Failed to create KRS" }, { status: 500 });
  }
}
