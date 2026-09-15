import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await prisma.classGroup.findUnique({
      where: { id },
      include: {
        programStudy: true,
        students: true,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching class group:", error);
    return NextResponse.json({ error: "Failed to fetch class group" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, programStudyId, cohort } = body;

    if (!code || !name || !programStudyId || !cohort) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.classGroup.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    const duplicateCode = await prisma.classGroup.findUnique({ where: { code: String(code).trim() } });
    if (duplicateCode && duplicateCode.id !== id) {
      return NextResponse.json({ error: "Kelas dengan kode ini sudah ada" }, { status: 400 });
    }

    const group = await prisma.classGroup.update({
      where: { id },
      data: {
        code: String(code).trim(),
        name: String(name).trim(),
        cohort: String(cohort).trim(),
        programStudyId: String(programStudyId),
      },
      include: {
        programStudy: true,
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error updating class group:", error);
    return NextResponse.json({ error: "Failed to update class group" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const group = await prisma.classGroup.findUnique({
      where: { id },
      include: { _count: { select: { students: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
    }

    if (group._count.students > 0) {
      return NextResponse.json({ error: "Tidak dapat menghapus kelas yang masih memiliki mahasiswa" }, { status: 400 });
    }

    await prisma.classGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class group:", error);
    return NextResponse.json({ error: "Failed to delete class group" }, { status: 500 });
  }
}
