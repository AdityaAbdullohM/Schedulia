import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard";
import Image from "next/image";
import LogoutButton from "./logout-button";
import CoursesManager from "./courses-manager";
import DashboardSidebar from "./sidebar";
import ScheduleManager from "./schedule-manager";
import UsersManager from "./users-manager";
import RoomsManager from "./rooms-manager";
import InstructorsManager from "./instructors-manager";
import ProgramStudiesManager from "./program-studies-manager";
import ClassGroupsManager from "./class-groups-manager";
import OverviewAdmin from "./overview-admin";
import KrsManager from "./krs-manager";
import StudentOverview from "./student-overview";
import LecturerOverview from "./lecturer-overview";
import LecturerSchedule from "./lecturer-schedule";
import StudentSchedule from "./student-schedule";

const roleLabels = {
  ADMIN: "Admin",
  DOSEN: "Dosen",
  MAHASISWA: "Mahasiswa",
} as const;

const sectionLabels = {
  overview: "Overview",
  jadwal: "Jadwal",
  krs: "KRS",
  courses: "Mata Kuliah",
  users: "Pengguna",
  ruangan: "Ruangan",
  dosen: "Dosen Pengampu",
  prodi: "Program Studi",
  kelas: "Kelas",
} as const;

type RoleKey = keyof typeof roleLabels;
type SectionKey = keyof typeof sectionLabels;

const allowedSectionsByRole: Record<RoleKey, SectionKey[]> = {
  ADMIN: ["overview", "jadwal", "courses", "users", "ruangan", "dosen", "prodi", "kelas"],
  DOSEN: ["overview", "jadwal", "krs"],
  MAHASISWA: ["overview", "jadwal", "krs"],
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; section?: string; userId?: string }>;
}) {
  const params = await searchParams;
  const role = (params.role ?? "ADMIN").toUpperCase();
  const userId = params.userId;
  const rawSection = (params.section ?? "overview").toLowerCase();

  if (!(role in roleLabels)) {
    notFound();
  }

  const roleKey = role as RoleKey;
  const section = allowedSectionsByRole[roleKey].includes(rawSection as SectionKey)
    ? (rawSection as SectionKey)
    : "overview";

  const data = await getDashboardData(roleKey, userId);
  const currentUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          status: true,
          nip: true,
          nim: true,
          angkatan: true,
          programStudy: {
            select: { name: true },
          },
          classGroup: {
            select: {
              programStudy: {
                select: { name: true },
              },
            },
          },
        },
      })
    : null;

  const renderSectionContent = () => {
    switch (section) {
      case "overview":
        if (roleKey === "ADMIN") {
          return <OverviewAdmin data={data} />;
        }

        if (roleKey === "MAHASISWA") {
          return <StudentOverview data={data} user={currentUser} userId={userId} />;
        }

        if (roleKey === "DOSEN") {
          return <LecturerOverview data={data} user={currentUser} userId={userId} />;
        }

        // For other roles, show existing overview
        return (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18, marginBottom: 24 }}>
              {data.stats.map((item) => (
                <div key={item.label} style={{ background: "white", borderRadius: 18, padding: 20, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{item.label}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: 8 }}>{item.value}</div>
                </div>
              ))}
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
              <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
                <h2 style={{ marginBottom: 16 }}>Jadwal Terbaru</h2>
                <div style={{ display: "grid", gap: 14 }}>
                  {data.schedules.map((schedule, index) => (
                    <div key={`${schedule.day}-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <strong>{schedule.day}</strong>
                        <span style={{ color: "#2563eb", fontWeight: 700 }}>{schedule.time}</span>
                      </div>
                      <div>{schedule.course}</div>
                      <div style={{ color: "#64748b" }}>Ruangan: {schedule.room}</div>
                      {schedule.lecturer ? <div style={{ color: "#64748b" }}>Dosen: {schedule.lecturer}</div> : null}
                      {schedule.students ? <div style={{ color: "#64748b" }}>{schedule.students}</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: 20 }}>
                <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
                  <h2 style={{ marginBottom: 16 }}>Peringatan</h2>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 10, color: "#334155" }}>
                    {data.alerts.map((alert) => (
                      <li key={alert}>{alert}</li>
                    ))}
                  </ul>
                </div>

              </div>
            </section>
          </>
        );

      case "krs":
        if (roleKey === "DOSEN" || roleKey === "MAHASISWA") {
          return <KrsManager role={roleKey} userId={userId} />;
        }
        return null;

      case "jadwal": {
        if (roleKey === "ADMIN") {
          return <ScheduleManager />;
        }

        if (roleKey === "DOSEN") {
          return <LecturerSchedule schedules={data.schedules} lecturerId={userId} />;
        }

        if (roleKey === "MAHASISWA") {
          return <StudentSchedule schedules={data.schedules} studentId={userId} />;
        }

        const roleSpecificCards = [
          { title: "Jadwal Saya", value: String(data.schedules.length), accent: "#db2777" },
          { title: "Ruangan", value: String(new Set(data.schedules.map((schedule) => schedule.room)).size), accent: "#ec4899" },
          { title: "Mata Kuliah", value: String(new Set(data.schedules.map((schedule) => schedule.course)).size), accent: "#f472b6" },
        ];

        return (
          <section style={{ display: "grid", gap: 24 }}>
            <div style={{ background: "white", borderRadius: 18, padding: 24, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0 }}>Detail Jadwal Kuliah</h2>
                <span style={{ background: "#eff6ff", color: "#2563eb", borderRadius: 999, padding: "8px 12px", fontWeight: 700, fontSize: 12 }}>
                  {roleLabels[roleKey]}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
                {roleSpecificCards.map((card) => (
                  <div key={card.title} style={{ background: "#f8fafc", borderRadius: 14, padding: 16, border: "1px solid #e2e8f0" }}>
                    <div style={{ color: "#64748b", fontSize: 13 }}>{card.title}</div>
                    <div style={{ marginTop: 8, fontWeight: 800, fontSize: "1.8rem", color: card.accent }}>{card.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {data.schedules.map((schedule, index) => (
                  <div key={`${schedule.day}-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 18 }}>{schedule.day}</strong>
                      <span style={{ color: "#2563eb", fontWeight: 800 }}>{schedule.time}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{schedule.course}</div>
                    <div style={{ color: "#64748b" }}>Ruangan: {schedule.room}</div>
                    {schedule.semester ? <div style={{ color: "#64748b" }}>Semester: {schedule.semester}</div> : null}
                    {schedule.lecturer ? <div style={{ color: "#64748b" }}>Dosen: {schedule.lecturer}</div> : null}
                    {schedule.students ? <div style={{ color: "#64748b" }}>{schedule.students}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "courses":
        return <CoursesManager />;

      case "users":
        return <UsersManager />;

      case "ruangan":
        if (roleKey === "ADMIN") {
          return <RoomsManager />;
        }
        return null;

      case "dosen":
        if (roleKey === "ADMIN") {
          return <InstructorsManager />;
        }
        return null;

      case "prodi":
        if (roleKey === "ADMIN") {
          return <ProgramStudiesManager />;
        }
        return null;

      case "kelas":
        if (roleKey === "ADMIN") {
          return <ClassGroupsManager />;
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", padding: 24 }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dashboard-layout {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .dashboard-main {
          flex: 1;
          min-width: 0;
        }

        .section-panel {
          animation: fadeInUp 0.28s ease-out;
        }

        .section-pill {
          transition: all 0.2s ease;
        }

        .section-pill:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 900px) {
          .dashboard-layout {
            gap: 12px;
          }

          .dashboard-main {
            width: auto;
          }
        }

        @media (max-width: 640px) {
          main {
            padding: 16px !important;
          }

          .dashboard-header {
            align-items: flex-start;
          }

          .dashboard-header h1 {
            font-size: 1.7rem !important;
          }

          .section-pill {
            flex: 1 1 calc(50% - 8px);
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>

      <div className="dashboard-layout">
        <DashboardSidebar role={roleKey} activeSection={section} userId={userId} />

        <div className="dashboard-main">
          <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Image src="/schedulia-logo.svg" alt="Logo Schedulia" width={48} height={48} style={{ width: 48, height: 48, objectFit: "contain" }} />
                <p style={{ color: "#2563eb", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>Schedulia</p>
              </div>
              {roleKey === "DOSEN" ? (
                <h1 style={{ fontSize: "2.2rem", margin: "8px 0 0" }}>
                  Selamat datang, {currentUser?.name ?? "Dosen"}
                </h1>
              ) : (
                <h1 style={{ fontSize: "2.2rem", margin: "8px 0 0" }}>Dashboard {roleLabels[roleKey]}</h1>
              )}
            </div>
            <LogoutButton />
          </header>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            {allowedSectionsByRole[roleKey].map((item) => (
              <a
                key={item}
                href={userId ? `/dashboard?role=${role}&userId=${userId}&section=${item}` : `/dashboard?role=${role}&section=${item}`}
                className="section-pill"
                style={{
                  textDecoration: "none",
                  borderRadius: 999,
                  padding: "10px 14px",
                  background: section === item ? "#2563eb" : "#e2e8f0",
                  color: section === item ? "white" : "#334155",
                  fontWeight: 700,
                  fontSize: 13,
                  border: section === item ? "1px solid #2563eb" : "1px solid transparent",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {sectionLabels[item]}
              </a>
            ))}
          </div>

          <div key={section} className="section-panel">
            {renderSectionContent()}
          </div>
        </div>
      </div>
    </main>
  );
}
