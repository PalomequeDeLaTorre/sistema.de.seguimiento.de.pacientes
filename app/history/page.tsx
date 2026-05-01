// app/history/page.tsx 
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  TrendingUp,
  FileDown,
} from "lucide-react";

// ── Design tokens (mismo sistema que Patients) ────────────────────────────────
const pink = "#C2185B";
const roseDust = "#D4788A";
const roseLight = "#fce8ee";
const rosePale = "#fdf6f8";
const roseBorder = "#f0d0d8";
const FONT =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const PIE_COLORS = [
  "#C2185B",
  "#D4788A",
  "#e8a0b0",
  "#f5c6d3",
  "#9c1248",
  "#ad1457",
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Followup {
  id: number;
  patient_id: number;
  full_name: string;
  sheet_number: number;
  created_at: string;
  content?: string;
}

interface Patient {
  id: number;
  full_name: string;
  age: number | null;
  created_at: string;
}

// ── 🔧 FUNCIÓN PARA CONVERTIR FECHA UTC A ZONA HORARIA DE MÉXICO ─────────────
function toMexicoDate(utcDate: string): Date {
  // Convertir la fecha UTC a la zona horaria de México
  const date = new Date(utcDate);
  return new Date(
    date.toLocaleString("en-US", { timeZone: "America/Mexico_City" }),
  );
}

function monthKey(iso: string) {
  const d = toMexicoDate(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const MONTHS_ES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${MONTHS_ES[parseInt(m) - 1]} ${y}`;
}

function shortMonth(key: string) {
  const [, m] = key.split("-");
  const MONTHS_ES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return MONTHS_ES[parseInt(m) - 1].slice(0, 3);
}

// ── Función para obtener la fecha actual en México ──────────────────────────
function getCurrentMexicoDate(): Date {
  const now = new Date();
  return new Date(
    now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }),
  );
}

// ── Función para convertir markdown a HTML ───────────────────────────────────
function parseToHTML(text: string): string {
  if (!text) return "<div><br></div>";
  return text
    .split("\n")
    .map((line) => {
      const parsed = line
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.+?)_/g, "<em>$1</em>");
      return `<div>${parsed || "<br>"}</div>`;
    })
    .join("");
}

// ── Función para generar PDF usando window.print ─────────────────────────────
async function generatePDFBlob(
  fullName: string,
  age: number | null,
  content: string,
  sheetNumber: number,
  createdAt: string,
): Promise<Blob> {
  const date = toMexicoDate(createdAt);
  const formattedDate = date.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const ageText = age ? ` · ${age} años` : "";
  const parsedContent = parseToHTML(
    content || "<div>Sin contenido registrado</div>",
  );

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Seguimiento - ${fullName} - Hoja ${sheetNumber}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 14px;
        line-height: 1.9;
        color: #1a1a1a;
        background: #fff;
        margin: 0;
        padding: 0;
      }
      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm 25mm;
        margin: 0 auto;
        background: #fff;
        position: relative;
      }
      .header {
        font-size: 12px;
        color: #666;
        padding-bottom: 8mm;
        margin-bottom: 6mm;
        border-bottom: 0.5px solid #ddd;
        display: flex;
        justify-content: space-between;
      }
      .patient-info {
        font-weight: bold;
        color: #C2185B;
      }
      .date-info {
        color: #888;
      }
      .sheet-number {
        font-size: 11px;
        color: #aaa;
        margin-bottom: 4mm;
      }
      .content {
        white-space: pre-wrap;
        word-break: break-word;
      }
      .content div { margin: 0; padding: 0; }
      strong { font-weight: bold; }
      em { font-style: italic; }
      @media print {
        @page { size: A4; margin: 0; }
        body { margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <span class="patient-info">${fullName}${ageText}</span>
        <span class="date-info">${formattedDate} · ${formattedTime}</span>
      </div>
      <div class="sheet-number">Hoja de seguimiento #${sheetNumber}</div>
      <div class="content">${parsedContent}</div>
    </div>
  </body>
  </html>`;

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve(new Blob([html], { type: "text/html" }));
        }, 500);
      }, 500);
    };

    iframe.srcdoc = html;
  });
}

// ── Custom Tooltip para barra ─────────────────────────────────────────────────
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${roseBorder}`,
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: FONT,
        boxShadow: "0 4px 16px rgba(0,0,0,.10)",
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: roseDust,
          margin: "0 0 4px",
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 14, color: pink, margin: 0, fontWeight: 800 }}>
        {payload[0].value} seguimiento{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Custom Tooltip para pastel ────────────────────────────────────────────────
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: `1.5px solid ${roseBorder}`,
        borderRadius: 10,
        padding: "10px 14px",
        fontFamily: FONT,
        boxShadow: "0 4px 16px rgba(0,0,0,.10)",
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: roseDust,
          margin: "0 0 4px",
          fontWeight: 700,
        }}
      >
        {payload[0].name}
      </p>
      <p style={{ fontSize: 14, color: pink, margin: 0, fontWeight: 800 }}>
        {payload[0].value} paciente{payload[0].value !== 1 ? "s" : ""} (
        {payload[0].payload.percent}%)
      </p>
    </div>
  );
}

// ── Collapsible month section ─────────────────────────────────────────────────
function MonthSection({
  monthKey: key,
  followups,
  patients,
}: {
  monthKey: string;
  followups: Followup[];
  patients: Patient[];
}) {
  const [open, setOpen] = useState(false);

  const newPatients = patients.filter((p) => monthKey(p.created_at) === key);

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1.5px solid ${roseBorder}`,
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: open ? rosePale : "#fff",
          border: "none",
          cursor: "pointer",
          gap: 12,
          borderBottom: open ? `1px solid ${roseBorder}` : "none",
          transition: "background .15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: open ? roseLight : "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background .15s",
            }}
          >
            <Calendar size={16} color={open ? pink : "#aaa"} />
          </div>
          <div style={{ textAlign: "left" }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#1a1a1a",
                fontFamily: FONT,
              }}
            >
              {monthLabel(key)}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#aaa",
                fontFamily: FONT,
              }}
            >
              {followups.length} seguimiento{followups.length !== 1 ? "s" : ""}
              {newPatients.length > 0 &&
                ` · ${newPatients.length} paciente${newPatients.length !== 1 ? "s" : ""} nuevo${newPatients.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div style={{ color: open ? pink : "#ccc", transition: "color .15s" }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 0 8px" }}>
          {newPatients.length > 0 && (
            <div style={{ padding: "12px 20px 8px" }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: roseDust,
                  margin: "0 0 8px",
                  fontFamily: FONT,
                }}
              >
                Pacientes registrados
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {newPatients.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: roseLight,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${pink}, ${roseDust})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1a1a1a",
                          fontFamily: FONT,
                        }}
                      >
                        {p.full_name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "#aaa",
                          fontFamily: FONT,
                        }}
                      >
                        {p.age ? `${p.age} años` : "Edad no registrada"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {followups.length > 0 && (
            <div style={{ padding: "12px 20px 4px" }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: roseDust,
                  margin: "0 0 8px",
                  fontFamily: FONT,
                }}
              >
                Seguimientos
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {followups
                  .slice()
                  .sort((a, b) => {
                    const dateA = toMexicoDate(a.created_at);
                    const dateB = toMexicoDate(b.created_at);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((f) => {
                    const d = toMexicoDate(f.created_at);
                    return (
                      <div
                        key={f.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: rosePale,
                          border: `1px solid ${roseBorder}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: roseDust,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {f.sheet_number}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#1a1a1a",
                              fontFamily: FONT,
                            }}
                          >
                            {f.full_name}
                          </p>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: "#aaa",
                            fontFamily: FONT,
                          }}
                        >
                          {d.toLocaleDateString("es-MX", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {followups.length === 0 && newPatients.length === 0 && (
            <p
              style={{
                padding: "16px 20px",
                margin: 0,
                fontSize: 13,
                color: "#aaa",
                fontFamily: FONT,
              }}
            >
              Sin actividad este mes.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "18px 20px",
        border: `1.5px solid ${roseBorder}`,
        boxShadow: "0 1px 4px rgba(0,0,0,.05)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        flex: 1,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: roseLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 900,
            color: "#1a1a1a",
            fontFamily: FONT,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 12,
            color: "#aaa",
            fontFamily: FONT,
          }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [fRes, pRes] = await Promise.all([
        fetch("/api/followups"),
        fetch("/api/patients"),
      ]);
      if (fRes.status === 401) {
        router.push("/login");
        return;
      }
      const fData: Followup[] = await fRes.json();
      const pData: Patient[] = await pRes.json();

      // Obtener contenidos completos
      const followupsWithContent = await Promise.all(
        fData.map(async (followup) => {
          const contentRes = await fetch(`/api/followups/${followup.id}`);
          if (contentRes.ok) {
            const fullData = await contentRes.json();
            return { ...followup, content: fullData.content || "" };
          }
          return { ...followup, content: "" };
        }),
      );

      setFollowups(followupsWithContent);
      setPatients(pData);
    } catch {
      console.error("Error fetching data");
    }
  }

  // ── Función para descargar todos los PDFs como ZIP ─────────────────────────
  async function downloadAllPDFs() {
    if (followups.length === 0) {
      alert("No hay seguimientos para descargar");
      return;
    }

    setDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      let successCount = 0;

      for (const followup of followups) {
        try {
          const patient = patients.find(
            (p) => p.full_name === followup.full_name,
          );
          const age = patient?.age || null;

          const date = toMexicoDate(followup.created_at);
          const formattedDate = date.toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const formattedTime = date.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          });

          const ageText = age ? ` · ${age} años` : "";
          const parsedContent = parseToHTML(
            followup.content || "<div>Sin contenido registrado</div>",
          );

          const html = `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Seguimiento - ${followup.full_name} - Hoja ${followup.sheet_number}</title>
            <style>
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body {
                font-family: Georgia, 'Times New Roman', serif;
                font-size: 14px;
                line-height: 1.9;
                color: #1a1a1a;
                background: #fff;
                margin: 0;
                padding: 0;
              }
              .page {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm 25mm;
                margin: 0 auto;
                background: #fff;
                position: relative;
              }
              .header {
                font-size: 12px;
                color: #666;
                padding-bottom: 8mm;
                margin-bottom: 6mm;
                border-bottom: 0.5px solid #ddd;
                display: flex;
                justify-content: space-between;
              }
              .patient-info {
                font-weight: bold;
                color: #C2185B;
              }
              .date-info {
                color: #888;
              }
              .sheet-number {
                font-size: 11px;
                color: #aaa;
                margin-bottom: 4mm;
              }
              .content {
                white-space: pre-wrap;
                word-break: break-word;
              }
              .content div { margin: 0; padding: 0; }
              strong { font-weight: bold; }
              em { font-style: italic; }
              @media print {
                @page { size: A4; margin: 0; }
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="header">
                <span class="patient-info">${followup.full_name}${ageText}</span>
                <span class="date-info">${formattedDate} · ${formattedTime}</span>
              </div>
              <div class="sheet-number">Hoja de seguimiento #${followup.sheet_number}</div>
              <div class="content">${parsedContent}</div>
            </div>
          </body>
          </html>`;

          const fileName =
            `${followup.full_name}_seguimiento_${followup.sheet_number}.html`.replace(
              /[/\\?%*:|"<>]/g,
              "-",
            );
          zip.file(fileName, html);
          successCount++;
        } catch (err) {
          console.error(
            `Error generando documento para ${followup.full_name}:`,
            err,
          );
        }
      }

      if (successCount === 0) {
        throw new Error("No se pudo generar ningún documento");
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seguimientos_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(
        `✅ Se descargaron ${successCount} documentos correctamente.\n\nLos archivos están en formato HTML. Para convertirlos a PDF:\n1. Abre cada archivo en Chrome/Edge\n2. Presiona Ctrl+P (Cmd+P en Mac)\n3. Selecciona "Guardar como PDF"`,
      );
    } catch (error) {
      console.error("Error creando ZIP:", error);
      alert("Error al generar el archivo ZIP. Por favor, intenta de nuevo.");
    } finally {
      setDownloading(false);
    }
  }

  // ── Chart 1: seguimientos por mes ──────────────────────────────────────────
  const barData = (() => {
    const now = getCurrentMexicoDate();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      );
    }
    const counts: Record<string, number> = {};
    followups.forEach((f) => {
      const k = monthKey(f.created_at);
      if (months.includes(k)) counts[k] = (counts[k] || 0) + 1;
    });
    return months.map((k) => ({
      mes: shortMonth(k),
      seguimientos: counts[k] || 0,
      key: k,
    }));
  })();

  // ── Chart 2: distribución de edades ──────────────────────────────────────
  const pieData = (() => {
    const buckets: Record<string, number> = {
      "0–17": 0,
      "18–30": 0,
      "31–45": 0,
      "46–60": 0,
      "61–75": 0,
      "76+": 0,
    };
    patients.forEach((p) => {
      const a = p.age;
      if (a === null) return;
      if (a <= 17) buckets["0–17"]++;
      else if (a <= 30) buckets["18–30"]++;
      else if (a <= 45) buckets["31–45"]++;
      else if (a <= 60) buckets["46–60"]++;
      else if (a <= 75) buckets["61–75"]++;
      else buckets["76+"]++;
    });
    const total = Object.values(buckets).reduce((s, v) => s + v, 0);
    return Object.entries(buckets)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
  })();

  // ── Monthly sections ──────────────────────────────────────────────────────
  const allMonths = (() => {
    const keys = new Set<string>();
    followups.forEach((f) => keys.add(monthKey(f.created_at)));
    patients.forEach((p) => keys.add(monthKey(p.created_at)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  })();

  // ── Stats ── CORREGIDO ─────────────────────────────────────────────────────────
  const totalFollowups = followups.length;
  const totalPatients = patients.length;

  // 🔥 Obtener fecha actual en México para comparar
  const getCurrentMexicoMonthKey = () => {
    const now = new Date();
    const mexicoDate = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }),
    );
    return `${mexicoDate.getFullYear()}-${String(mexicoDate.getMonth() + 1).padStart(2, "0")}`;
  };

  const thisMonthKey = getCurrentMexicoMonthKey();
  const thisMonth = followups.filter((f) => {
    const fDate = new Date(f.created_at);
    const fMonthKey = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, "0")}`;
    return fMonthKey === thisMonthKey;
  }).length;

  return (
    <div
      style={{ minHeight: "100vh", background: "#f8f8f8", fontFamily: FONT }}
    >
      <div style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <Navbar />
      </div>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* ── Page header ── */}
        <div
          style={{
            marginBottom: 24,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,.06)",
            border: "1px solid #f0f0f0",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: pink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BarChart2 size={22} color="#fff" />
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: pink,
                  margin: 0,
                }}
              >
                Estadísticas
              </p>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  margin: "2px 0 0",
                }}
              >
                Historial
              </h1>
              <p style={{ fontSize: 13, color: "#aaa", margin: "2px 0 0" }}>
                Seguimientos y actividad clínica
              </p>
            </div>
          </div>

          <button
            onClick={downloadAllPDFs}
            disabled={downloading || followups.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 40,
              background: downloading ? "#ccc" : pink,
              border: "none",
              cursor: downloading ? "not-allowed" : "pointer",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONT,
              transition: "background .15s",
            }}
          >
            <FileDown size={18} />
            <span>
              {downloading
                ? "Generando ZIP..."
                : `Descargar ${totalFollowups} (ZIP)`}
            </span>
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <StatCard
            label="Total pacientes"
            value={totalPatients}
            icon={<Users size={20} color={pink} />}
          />
          <StatCard
            label="Total seguimientos"
            value={totalFollowups}
            icon={<Calendar size={20} color={pink} />}
          />
          <StatCard
            label="Este mes"
            value={thisMonth}
            icon={<TrendingUp size={20} color={pink} />}
          />
        </div>

        {/* ── Charts row ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px 20px 12px",
              border: `1.5px solid ${roseBorder}`,
              boxShadow: "0 1px 4px rgba(0,0,0,.05)",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: roseDust,
                  margin: 0,
                }}
              >
                Últimos 6 meses
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#1a1a1a",
                  margin: "2px 0 0",
                }}
              >
                Seguimientos
              </p>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={28}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f5e8ec"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: "#aaa", fontFamily: FONT }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#aaa", fontFamily: FONT }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip
                    content={<BarTooltip />}
                    cursor={{ fill: roseLight }}
                  />
                  <Bar
                    dataKey="seguimientos"
                    fill={pink}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "20px 20px 12px",
              border: `1.5px solid ${roseBorder}`,
              boxShadow: "0 1px 4px rgba(0,0,0,.05)",
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: roseDust,
                  margin: 0,
                }}
              >
                Pacientes por rango
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#1a1a1a",
                  margin: "2px 0 0",
                }}
              >
                Distribución de edades
              </p>
            </div>
            {pieData.length === 0 ? (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{ color: "#ccc", fontSize: 13 }}>Sin datos de edad</p>
              </div>
            ) : (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                      innerRadius={36}
                      paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#555",
                            fontFamily: FONT,
                          }}
                        >
                          {v}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ── Monthly collapsible history ── */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 4,
                height: 20,
                borderRadius: 99,
                background: pink,
              }}
            />
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: roseDust,
                margin: 0,
              }}
            >
              Historial por mes
            </p>
          </div>

          {allMonths.length === 0 ? (
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "3rem 2rem",
                border: `1.5px solid ${roseBorder}`,
                textAlign: "center",
              }}
            >
              <p style={{ color: "#ccc", fontSize: 14, fontFamily: FONT }}>
                Sin registros todavía
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {allMonths.map((key) => (
                <MonthSection
                  key={key}
                  monthKey={key}
                  followups={followups.filter(
                    (f) => monthKey(f.created_at) === key,
                  )}
                  patients={patients.filter(
                    (p) => monthKey(p.created_at) === key,
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
