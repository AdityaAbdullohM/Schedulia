import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const studies = await prisma.programStudy.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { courses: true, classGroups: true },
        },
      },
    });

    return NextResponse.json(studies);
  } catch (error) {
    console.error("Error fetching program studies:", error);
    return NextResponse.json({ error: "Failed to fetch program studies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, degree } = body;

    if (!code || !name || !degree) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedCode = String(code).trim();
    const normalizedName = String(name).trim();
    const normalizedDegree = String(degree).trim();

    const existingCode = await prisma.programStudy.findUnique({ where: { code: normalizedCode } });
    if (existingCode) {
      return NextResponse.json({ error: "Program studi dengan kode ini sudah ada" }, { status: 400 });
    }

    const existingName = await prisma.programStudy.findFirst({ where: { name: normalizedName } });
    if (existingName) {
      return NextResponse.json({ error: "Program studi dengan nama ini sudah ada" }, { status: 400 });
    }

    const study = await prisma.programStudy.create({
      data: {
        code: normalizedCode,
        name: normalizedName,
        degree: normalizedDegree,
      },
    });

    return NextResponse.json(study, { status: 201 });
  } catch (error) {
    console.error("Error creating program study:", error);
    return NextResponse.json({ error: "Failed to create program study" }, { status: 500 });
  }
}
