import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, userId } = body;

    if (!status || !userId) {
      return NextResponse.json({ error: "Status dan userId wajib diisi" }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        classSchedule: { select: { lecturerId: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "KRS tidak ditemukan" }, { status: 404 });
    }

    if (enrollment.classSchedule.lecturerId !== userId) {
      return NextResponse.json({ error: "Anda bukan dosen pengampu dari KRS ini" }, { status: 403 });
    }

    const updated = await prisma.enrollment.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating KRS:", error);
    return NextResponse.json({ error: "Failed to update KRS" }, { status: 500 });
  }
}
