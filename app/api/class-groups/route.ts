import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const groups = await prisma.classGroup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        programStudy: true,
        _count: { select: { students: true } },
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching class groups:", error);
    return NextResponse.json({ error: "Failed to fetch class groups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, programStudyId, cohort } = body;

    if (!code || !name || !programStudyId || !cohort) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedCode = String(code).trim();
    const normalizedName = String(name).trim();

    const existingCode = await prisma.classGroup.findUnique({ where: { code: normalizedCode } });
    if (existingCode) {
      return NextResponse.json({ error: "Kelas dengan kode ini sudah ada" }, { status: 400 });
    }

    const study = await prisma.programStudy.findUnique({ where: { id: String(programStudyId) } });
    if (!study) {
      return NextResponse.json({ error: "Program studi tidak valid" }, { status: 400 });
    }

    const group = await prisma.classGroup.create({
      data: {
        code: normalizedCode,
        name: normalizedName,
        cohort: String(cohort).trim(),
        programStudyId: String(programStudyId),
      },
      include: {
        programStudy: true,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating class group:", error);
    return NextResponse.json({ error: "Failed to create class group" }, { status: 500 });
  }
}
