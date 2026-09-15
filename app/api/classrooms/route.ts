import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all classrooms
export async function GET(request: NextRequest) {
  try {
    const classrooms = await prisma.classroom.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { schedules: true }
        }
      }
    });
    return NextResponse.json(classrooms);
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    return NextResponse.json({ error: "Failed to fetch classrooms" }, { status: 500 });
  }
}

// POST create new classroom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, capacity } = body;

    if (!name || !capacity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingClassroom = await prisma.classroom.findUnique({
      where: { name }
    });

    if (existingClassroom) {
      return NextResponse.json({ error: "Classroom name already exists" }, { status: 400 });
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        capacity: parseInt(capacity)
      }
    });

    return NextResponse.json(classroom, { status: 201 });
  } catch (error) {
    console.error("Error creating classroom:", error);
    return NextResponse.json({ error: "Failed to create classroom" }, { status: 500 });
  }
}
