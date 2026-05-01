// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import {
  Users,
  UserPlus,
  ClipboardList,
  TrendingUp,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const cookieStore = await import("next/headers").then((mod) => mod.cookies());
  const sessionCookie = cookieStore.get("session")?.value;
  const cookieHeader = sessionCookie ? `session=${sessionCookie}` : "";

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "https://sistema-de-seguimiento-de-pacientes.vercel.app"}/api/export?type=stats`,
    { headers: { cookie: cookieHeader } },
  );

  let stats = {
    totalPatients: 0,
    todayPatients: 0,
    totalFollowups: 0,
    todayFollowups: 0,
  };
  if (res.ok) {
    stats = await res.json();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Header de bienvenida ── */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#C2185B] flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>

          <div>
            <p className="text-xs font-medium text-[#C2185B] uppercase tracking-widest mb-0.5">
              Panel de control
            </p>
            <h1 className="text-2xl font-black text-gray-800 leading-tight">
              Bienvenida, Dra. {session.name}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Resumen de tu actividad clínica
            </p>
          </div>
        </div>

        {/* ── Tarjetas de estadísticas ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Total Pacientes
                </p>
                <p className="text-3xl font-black text-[#C2185B]">
                  {stats.totalPatients}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fdf3f4] flex items-center justify-center">
                <Users className="text-[#E8AEB7]" size={24} />
              </div>
            </div>
            <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
              <div className="h-1 bg-[#E8AEB7] rounded-full w-3/4" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Pacientes Hoy
                </p>
                <p className="text-3xl font-black text-[#C2185B]">
                  {stats.todayPatients}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fdf3f4] flex items-center justify-center">
                <UserPlus className="text-[#E8AEB7]" size={24} />
              </div>
            </div>
            <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
              <div className="h-1 bg-[#E8AEB7] rounded-full w-1/2" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Total Seguimientos
                </p>
                <p className="text-3xl font-black text-[#C2185B]">
                  {stats.totalFollowups}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fdf3f4] flex items-center justify-center">
                <ClipboardList className="text-[#E8AEB7]" size={24} />
              </div>
            </div>
            <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
              <div className="h-1 bg-[#E8AEB7] rounded-full w-2/3" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Seguimientos Hoy
                </p>
                <p className="text-3xl font-black text-[#C2185B]">
                  {stats.todayFollowups}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fdf3f4] flex items-center justify-center">
                <TrendingUp className="text-[#E8AEB7]" size={24} />
              </div>
            </div>
            <div className="mt-3 h-1 w-full bg-gray-100 rounded-full">
              <div className="h-1 bg-[#E8AEB7] rounded-full w-1/4" />
            </div>
          </div>
        </div>

        {/* ── Acciones rápidas ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-[#C2185B] rounded-full" />
            <h2 className="text-base font-bold text-gray-800">
              Acciones Rápidas
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/patients"
              className="px-5 py-2.5 bg-[#D4788A] text-white rounded-lg hover:bg-[#B85C6E] transition text-sm font-semibold shadow-sm shadow-[#C2185B]/30"
            >
              Buscar Pacientes
            </Link>
            <Link
              href="/patients?register=true"
              className="px-5 py-2.5 bg-[#F49B9F] text-white rounded-lg hover:bg-[#D97A7E] transition text-sm font-semibold shadow-sm shadow-[#C2185B]/30"
            >
              Nuevo Paciente
            </Link>
            <Link
              href="/history"
              className="px-5 py-2.5 bg-[#816F63] text-white border border-[#F49B9F] rounded-lg hover:bg-[#6A5A50] transition text-sm font-semibold shadow-sm shadow-[#00796B]/30"
            >
              Historial
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
