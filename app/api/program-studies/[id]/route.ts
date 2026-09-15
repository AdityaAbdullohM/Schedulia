import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const study = await prisma.programStudy.findUnique({
      where: { id },
      include: {
        courses: true,
        classGroups: true,
      },
    });

    if (!study) {
      return NextResponse.json({ error: "Program studi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(study);
  } catch (error) {
    console.error("Error fetching program study:", error);
    return NextResponse.json({ error: "Failed to fetch program study" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, degree } = body;

    if (!code || !name || !degree) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.programStudy.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Program studi tidak ditemukan" }, { status: 404 });
    }

    const duplicateCode = await prisma.programStudy.findUnique({ where: { code: String(code).trim() } });
    if (duplicateCode && duplicateCode.id !== id) {
      return NextResponse.json({ error: "Program studi dengan kode ini sudah ada" }, { status: 400 });
    }

    const duplicateName = await prisma.programStudy.findFirst({ where: { name: String(name).trim() } });
    if (duplicateName && duplicateName.id !== id) {
      return NextResponse.json({ error: "Program studi dengan nama ini sudah ada" }, { status: 400 });
    }

    const study = await prisma.programStudy.update({
      where: { id },
      data: {
        code: String(code).trim(),
        name: String(name).trim(),
        degree: String(degree).trim(),
      },
    });

    return NextResponse.json(study);
  } catch (error) {
    console.error("Error updating program study:", error);
    return NextResponse.json({ error: "Failed to update program study" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const study = await prisma.programStudy.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true, classGroups: true },
        },
      },
    });

    if (!study) {
      return NextResponse.json({ error: "Program studi tidak ditemukan" }, { status: 404 });
    }

    if (study._count.courses > 0 || study._count.classGroups > 0) {
      return NextResponse.json({ error: "Tidak dapat menghapus program studi yang masih digunakan" }, { status: 400 });
    }

    await prisma.programStudy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting program study:", error);
    return NextResponse.json({ error: "Failed to delete program study" }, { status: 500 });
  }
}
