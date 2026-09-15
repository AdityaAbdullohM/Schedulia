import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const scheduleId = request.nextUrl.searchParams.get("scheduleId");
    const studentId = request.nextUrl.searchParams.get("studentId");
    const records = await prisma.attendance.findMany({
      where: {
        enrollment: {
          ...(scheduleId ? { classScheduleId: scheduleId } : {}),
          ...(studentId ? { studentId } : {}),
        },
      },
      include: { enrollment: { select: { id: true, studentId: true, classScheduleId: true } } },
      orderBy: [{ meeting: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enrollmentId, classScheduleId, meeting, status, notes, lecturerId } = body;
    const meetingNumber = Number(meeting);

    if (!enrollmentId || !classScheduleId || !Number.isInteger(meetingNumber) || meetingNumber < 1 || !status) {
      return NextResponse.json({ error: "Data absensi tidak lengkap" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { classSchedule: { select: { lecturerId: true } } },
    });
    if (!enrollment || enrollment.classScheduleId !== classScheduleId) {
      return NextResponse.json({ error: "Enrollment tidak valid" }, { status: 400 });
    }
    if (lecturerId && enrollment.classSchedule.lecturerId !== lecturerId) {
      return NextResponse.json({ error: "Anda bukan dosen pengampu" }, { status: 403 });
    }

    const record = await prisma.attendance.upsert({
      where: { enrollmentId_meeting: { enrollmentId, meeting: meetingNumber } },
      update: { status: String(status), notes: notes ? String(notes) : null },
      create: { enrollmentId, meeting: meetingNumber, status: String(status), notes: notes ? String(notes) : null },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error saving attendance:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}
