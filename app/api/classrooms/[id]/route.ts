import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET single classroom
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        schedules: true
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json(classroom);
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return NextResponse.json({ error: "Failed to fetch classroom" }, { status: 500 });
  }
}

// PUT update classroom
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, capacity } = body;

    if (!name || !capacity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if new name already exists (and it's not the same classroom)
    const existingClassroom = await prisma.classroom.findUnique({
      where: { name }
    });

    if (existingClassroom && existingClassroom.id !== id) {
      return NextResponse.json({ error: "Classroom name already exists" }, { status: 400 });
    }

    const updatedClassroom = await prisma.classroom.update({
      where: { id },
      data: {
        name,
        capacity: parseInt(capacity)
      }
    });

    return NextResponse.json(updatedClassroom);
  } catch (error) {
    console.error("Error updating classroom:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update classroom" }, { status: 500 });
  }
}

// DELETE classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if classroom has schedules
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: { _count: { select: { schedules: true } } }
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (classroom._count.schedules > 0) {
      return NextResponse.json(
        { error: "Cannot delete classroom with active schedules" },
        { status: 400 }
      );
    }

    await prisma.classroom.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Classroom deleted successfully" });
  } catch (error) {
    console.error("Error deleting classroom:", error);
    return NextResponse.json({ error: "Failed to delete classroom" }, { status: 500 });
  }
}
