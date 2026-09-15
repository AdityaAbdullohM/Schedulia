import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const scheduleId = request.nextUrl.searchParams.get("scheduleId");
    const announcements = await prisma.announcement.findMany({
      where: scheduleId ? { classScheduleId: scheduleId } : undefined,
      include: {
        lecturer: { select: { id: true, name: true } },
        replies: {
          include: { student: { select: { id: true, name: true, nim: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, classScheduleId, lecturerId, announcementId, studentId, content } = body;
    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: "Isi pengumuman wajib diisi" }, { status: 400 });
    }

    if (action === "reply") {
      const announcement = await prisma.announcement.findUnique({ where: { id: announcementId } });
      if (!announcement || !studentId) {
        return NextResponse.json({ error: "Pengumuman atau mahasiswa tidak valid" }, { status: 400 });
      }
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_classScheduleId: { studentId, classScheduleId: announcement.classScheduleId } },
      });
      if (!enrollment || enrollment.status !== "AKTIF") {
        return NextResponse.json({ error: "Mahasiswa belum memiliki KRS aktif pada mata kuliah ini" }, { status: 403 });
      }
      const reply = await prisma.announcementReply.create({
        data: { announcementId, studentId, content: String(content).trim() },
        include: { student: { select: { id: true, name: true, nim: true } } },
      });
      return NextResponse.json(reply, { status: 201 });
    }

    if (!classScheduleId || !lecturerId) {
      return NextResponse.json({ error: "Jadwal dan dosen wajib diisi" }, { status: 400 });
    }
    const schedule = await prisma.classSchedule.findUnique({ where: { id: classScheduleId }, select: { lecturerId: true } });
    if (!schedule || schedule.lecturerId !== lecturerId) {
      return NextResponse.json({ error: "Anda bukan dosen pengampu" }, { status: 403 });
    }
    const announcement = await prisma.announcement.create({
      data: { classScheduleId, lecturerId, content: String(content).trim() },
      include: { lecturer: { select: { id: true, name: true } }, replies: true },
    });
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error saving announcement:", error);
    return NextResponse.json({ error: "Failed to save announcement" }, { status: 500 });
  }
}
