import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, nip, nim, angkatan, classGroupId, programStudyId, password, status } = body;

    let resolvedClassGroupId: string | null = null;

    if (role === "MAHASISWA") {
      if (!nim || String(nim).length <= 2) {
        return NextResponse.json({ error: "NIM harus memiliki angka lanjutan setelah awalan angkatan" }, { status: 400 });
      }

      if (nim && angkatan !== undefined && angkatan !== null && angkatan !== "") {
        const expectedPrefix = String(angkatan).slice(-2);
        if (!String(nim).startsWith(expectedPrefix)) {
          return NextResponse.json({ error: "Dua angka awal NIM harus mengikuti angkatan" }, { status: 400 });
        }
      }

      const selectedProgramStudyId = programStudyId ?? classGroupId;
      if (selectedProgramStudyId) {
        const study = await prisma.programStudy.findUnique({
          where: { id: String(selectedProgramStudyId) },
        });

        if (!study) {
          return NextResponse.json({ error: "Program studi tidak valid" }, { status: 400 });
        }

        const matchingGroup = await prisma.classGroup.findFirst({
          where: { programStudyId: String(selectedProgramStudyId) },
        });

        resolvedClassGroupId = matchingGroup?.id ?? null;
      }
    }

    // Validate programStudyId for DOSEN
    let resolvedProgramStudyId: string | null = null;
    if (role === "DOSEN" && programStudyId) {
      const study = await prisma.programStudy.findUnique({
        where: { id: String(programStudyId) },
      });

      if (!study) {
        return NextResponse.json({ error: "Program studi tidak valid" }, { status: 400 });
      }

      resolvedProgramStudyId = String(programStudyId);
    }

    const updateData: any = {
      name,
      email,
      role: role as any,
      nip: role === "ADMIN" || role === "DOSEN" ? nip : undefined,
      nim: role === "MAHASISWA" ? nim : undefined,
      angkatan: role === "MAHASISWA" && angkatan !== undefined && angkatan !== null && angkatan !== "" ? Number(angkatan) : null,
      classGroupId: role === "MAHASISWA" ? resolvedClassGroupId : null,
      programStudyId: role === "DOSEN" ? resolvedProgramStudyId : null,
      status: status || "Aktif",
    };

    if (typeof password === "string" && password.trim()) {
      updateData.passwordHash = Buffer.from(password).toString("base64");
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        programStudy: true,
        classGroup: {
          include: {
            programStudy: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating user:", errorMessage);
    console.error("Full error:", error);
    return NextResponse.json({ error: `Failed to update user: ${errorMessage}` }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
