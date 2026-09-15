import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
        programStudy: true,
        classGroup: {
          include: {
            programStudy: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const safeUsers = users.map(({ passwordHash, ...user }) => ({
      ...user,
      hasPassword: Boolean(passwordHash),
      password: passwordHash ? Buffer.from(passwordHash, "base64").toString("utf8") : "",
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, nip, nim, angkatan, password, classGroupId, programStudyId, status } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    let resolvedClassGroupId: string | undefined;

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

        resolvedClassGroupId = matchingGroup?.id ?? undefined;
      }
    }

    // Validate programStudyId for DOSEN
    let resolvedProgramStudyId: string | undefined;
    if (role === "DOSEN" && programStudyId) {
      const study = await prisma.programStudy.findUnique({
        where: { id: String(programStudyId) },
      });

      if (!study) {
        return NextResponse.json({ error: "Program studi tidak valid" }, { status: 400 });
      }

      resolvedProgramStudyId = String(programStudyId);
    }

    const userData: any = {
      name,
      email,
      role: role as any,
      passwordHash: Buffer.from(password || "default").toString("base64"),
      status: status || "Aktif",
    };

    if (role === "ADMIN" || role === "DOSEN") {
      if (nip) userData.nip = nip;
    }

    if (role === "MAHASISWA") {
      if (nim) userData.nim = nim;
      if (angkatan !== undefined && angkatan !== null && angkatan !== "") {
        userData.angkatan = Number(angkatan);
      }
      if (resolvedClassGroupId) userData.classGroupId = resolvedClassGroupId;
    }

    if (role === "DOSEN" && resolvedProgramStudyId) {
      userData.programStudyId = resolvedProgramStudyId;
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        programStudy: true,
        classGroup: {
          include: {
            programStudy: true,
          },
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating user:", errorMessage);
    console.error("Full error:", error);
    return NextResponse.json({ error: `Failed to create user: ${errorMessage}` }, { status: 500 });
  }
}
