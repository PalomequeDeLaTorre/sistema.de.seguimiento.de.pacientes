// app/patients/page.tsx
"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import SheetEditor from "@/components/SheetEditor";
import {
  Plus,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  Check,
  MoreVertical,
  AlertTriangle,
  ArrowLeft,
  User,
  Calendar,
  Edit2,
} from "lucide-react";

interface Patient {
  id: number;
  full_name: string;
  age: number | null;
  created_at: string;
}

interface Followup {
  id: number;
  patient_id: number;
  sheet_number: number;
  content: string;
  created_at: string;
  full_name: string;
}

type View = "list" | "register" | "editor";

function formatDropdownDate(iso: string, isCurrent: boolean) {
  const d = new Date(iso);
  if (isCurrent) {
    return d.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return (
    d.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    }) +
    " · " +
    d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatHistoryDate(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d.toLocaleDateString("es-MX", { weekday: "long" }),
    date: d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" }),
    year: d.getFullYear(),
  };
}

function isWithin24h(followups: Followup[]): boolean {
  if (!followups.length) return false;
  const latest = followups.reduce((a, b) =>
    new Date(a.created_at) > new Date(b.created_at) ? a : b,
  );
  return (
    Date.now() - new Date(latest.created_at).getTime() < 24 * 60 * 60 * 1000
  );
}

function PatientsPageContent() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  // ── FIX: iniciar loading en false para no mostrar pantalla en blanco ──
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("list");

  const [form, setForm] = useState({ full_name: "", age: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [activeFollowups, setActiveFollowups] = useState<Followup[]>([]);
  const [currentFollowupId, setCurrentFollowupId] = useState<number | null>(
    null,
  );
  const [openDropdown, setOpenDropdown] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedListPatient, setSelectedListPatient] =
    useState<Patient | null>(null);
  const [patientFollowupsMap, setPatientFollowupsMap] = useState<
    Record<number, Followup[]>
  >({});
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Patient | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("register") === "true") {
      setView("register");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpenId(null);
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpenDropdown(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function fetchAll() {
    try {
      const [pRes, fRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/followups"),
      ]);
      if (pRes.status === 401) {
        router.push("/login");
        return;
      }
      const pData: Patient[] = await pRes.json();
      const fData: Followup[] = await fRes.json();
      setPatients(pData);
      setFollowups(fData);
      buildMap(fData);
    } catch {
      console.error("Error fetching");
    }
  }

  function buildMap(fData: Followup[]) {
    const map: Record<number, Followup[]> = {};
    fData.forEach((f) => {
      if (!map[f.patient_id]) map[f.patient_id] = [];
      map[f.patient_id].push(f);
    });
    Object.values(map).forEach((arr) =>
      arr.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    );
    setPatientFollowupsMap(map);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const age = form.age ? parseInt(form.age) : null;
    if (age !== null && age > 100) {
      setFormError("Máximo 100 años.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: form.full_name, age }),
    });
    if (res.ok) {
      const newPatient: Patient = await res.json();
      setPatients((prev) => [newPatient, ...prev]);
      setForm({ full_name: "", age: "" });
      await openEditorForPatient(newPatient);
    }
    setSaving(false);
  }

  async function openEditorForPatient(patient: Patient) {
    setActivePatient(patient);
    const res = await fetch(`/api/followups?patient_id=${patient.id}`);
    const data: Followup[] = await res.json();
    const sorted = data.sort((a, b) => a.sheet_number - b.sheet_number);
    setActiveFollowups(sorted);
    if (sorted.length === 0) {
      await createFollowupFor(patient, []);
    } else {
      const within = isWithin24h(sorted);
      const target = within ? sorted[sorted.length - 1] : null;
      if (within && target) {
        setCurrentFollowupId(target.id);
        setEditingContent(target.content);
        setView("editor");
        setOpenDropdown(false);
      } else {
        await createFollowupFor(patient, sorted);
      }
    }
  }

  async function createFollowupFor(patient: Patient, current: Followup[]) {
    const res = await fetch("/api/followups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patient.id, content: "" }),
    });
    if (res.ok) {
      const newF: Followup = await res.json();
      const updated = [...current, { ...newF, full_name: patient.full_name }];
      setActiveFollowups(updated);
      setCurrentFollowupId(newF.id);
      setEditingContent("");
      setPatientFollowupsMap((prev) => {
        const arr = [...(prev[patient.id] ?? []), newF].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        return { ...prev, [patient.id]: arr };
      });
    }
    setView("editor");
    setOpenDropdown(false);
  }

  async function handleSaveContent(content: string) {
    if (!currentFollowupId) return;
    setEditingContent(content);
    setActiveFollowups((prev) =>
      prev.map((f) => (f.id === currentFollowupId ? { ...f, content } : f)),
    );
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await fetch(`/api/followups/${currentFollowupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    }, 800);
  }

  async function handleFinish() {
    if (!currentFollowupId) {
      setView("list");
      return;
    }
    setIsSaving(true);
    await fetch(`/api/followups/${currentFollowupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editingContent }),
    });
    setIsSaving(false);
    await fetchAll();
    setView("list");
  }

  // ─────────────────────────────────────────────────────────────────
  // REEMPLAZA la función handlePrint en app/patients/page.tsx
  // con esta versión. No cambies nada más.
  // ─────────────────────────────────────────────────────────────────

  function handlePrint() {
    const getHtmlBtn = document.querySelector<HTMLButtonElement>(
      "[data-get-print-html]",
    );
    if (getHtmlBtn) getHtmlBtn.click();

    setTimeout(() => {
      const cleanHTML = getHtmlBtn?.dataset?.html ?? "";
      const patientInfo = activePatient
        ? `${activePatient.full_name}${activePatient.age ? " · " + activePatient.age + " años" : ""}`
        : "";

      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>Ficha</title>
      <style>
        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 14px;
          line-height: 1.9;
          color: #1a1a1a;
          background: #fff;
        }

        /* ── Page wrapper: each .page is one A4 sheet ── */
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm 25mm;
          margin: 0 auto;
          background: #fff;
          position: relative;
          overflow: hidden;
        }

        .header {
          font-size: 12px;
          color: #777;
          padding-bottom: 8mm;
          margin-bottom: 6mm;
          border-bottom: 0.5px solid #ddd;
        }

        .content {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .content div { margin: 0; padding: 0; }

        strong { font-weight: bold; }
        em { font-style: italic; }

        /* ── Print: force page breaks between .page divs ── */
        @media print {
          html, body { margin: 0; padding: 0; background: #fff; }
          .page {
            width: 210mm;
            min-height: 297mm;
            max-height: 297mm;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          }
          .page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }

        /* ── Screen preview ── */
        @media screen {
          body { background: #e0e0e0; padding: 20px 0; }
          .page {
            box-shadow: 0 2px 12px rgba(0,0,0,0.18);
            margin: 0 auto 16px;
          }
        }
      </style>
    </head><body id="print-body">
      <script>
        // Split the raw HTML into pages by measuring line heights
        // This runs after the DOM is ready.
        window.addEventListener('DOMContentLoaded', function() {
          var body = document.getElementById('print-body');
          var rawHTML = ${JSON.stringify(cleanHTML || "<div><br></div>")};
          var patientInfo = ${JSON.stringify(patientInfo)};

          // Create a hidden measurement container
          var measure = document.createElement('div');
          measure.style.cssText = [
            'position:absolute', 'top:-9999px', 'left:0',
            'width:160mm',  // 210mm - 50mm padding
            'font-family:Georgia,"Times New Roman",serif',
            'font-size:14px', 'line-height:1.9',
            'white-space:pre-wrap', 'word-break:break-word',
            'visibility:hidden'
          ].join(';');
          measure.innerHTML = rawHTML;
          document.body.appendChild(measure);

          // Get all child nodes (divs) from the editor HTML
          var nodes = Array.from(measure.childNodes);
          
          // Available height per page in px (297mm - 40mm padding = 257mm ≈ 971px at 96dpi)
          // Header takes ~30px on first page
          var PX_PER_MM = 96 / 25.4;
          var pageContentH = Math.floor(257 * PX_PER_MM);  // ~971px
          var headerH = 30;

          // Build pages by accumulating nodes until height exceeded
          var pages = [];
          var currentPage = [];
          var usedH = headerH; // first page has header

          // Measure each node's height
          var tempDiv = document.createElement('div');
          tempDiv.style.cssText = measure.style.cssText;
          tempDiv.style.position = 'absolute';
          tempDiv.style.top = '-9999px';
          document.body.appendChild(tempDiv);

          nodes.forEach(function(node) {
            var clone = node.cloneNode(true);
            tempDiv.innerHTML = '';
            tempDiv.appendChild(clone);
            var h = tempDiv.scrollHeight || 27; // fallback ~1 line

            if (usedH + h > pageContentH && currentPage.length > 0) {
              // Start new page
              pages.push(currentPage);
              currentPage = [node.cloneNode ? node.cloneNode(true) : node];
              usedH = h;
            } else {
              currentPage.push(node.cloneNode ? node.cloneNode(true) : node);
              usedH += h;
            }
          });
          if (currentPage.length > 0) pages.push(currentPage);

          document.body.removeChild(measure);
          document.body.removeChild(tempDiv);

          // If no pages, create one empty page
          if (pages.length === 0) pages = [[]];

          // Render pages
          body.innerHTML = '';
          pages.forEach(function(pageNodes, idx) {
            var pageDiv = document.createElement('div');
            pageDiv.className = 'page';

            // Header only on first page
            if (idx === 0 && patientInfo) {
              var h = document.createElement('div');
              h.className = 'header';
              h.textContent = patientInfo;
              pageDiv.appendChild(h);
            }

            var content = document.createElement('div');
            content.className = 'content';
            pageNodes.forEach(function(n) {
              content.appendChild(n.cloneNode ? n.cloneNode(true) : n);
            });
            pageDiv.appendChild(content);
            body.appendChild(pageDiv);
          });

          // Print immediately after rendering
          window.focus();
          window.print();
        });
      </script>
    </body></html>`);
      win.document.close();
    }, 50);
  }

  const currentFollowup =
    activeFollowups.find((f) => f.id === currentFollowupId) ?? null;
  const dropdownFollowups = [...activeFollowups].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const displayed = showAll ? filtered : filtered.slice(0, 5);

  async function handleDeletePatient(patient: Patient) {
    await fetch(`/api/patients/${patient.id}`, { method: "DELETE" });
    setPatients((prev) => prev.filter((p) => p.id !== patient.id));
    if (selectedListPatient?.id === patient.id) setSelectedListPatient(null);
    setDeleteConfirm(null);
    setMenuOpenId(null);
    setPatientFollowupsMap((prev) => {
      const n = { ...prev };
      delete n[patient.id];
      return n;
    });
  }

  // ── Design tokens ──
  const pink = "#C2185B";
  const roseDust = "#D4788A";
  const roseLight = "#fce8ee";
  const rosePale = "#fdf6f8";
  const roseBorder = "#f0d0d8";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .patient-list-scroll { overflow-y: auto; max-height: 320px; scrollbar-width: thin; scrollbar-color: #f0d0d8 transparent; }
        .patient-list-scroll::-webkit-scrollbar { width: 4px; }
        .patient-list-scroll::-webkit-scrollbar-thumb { background: #f0d0d8; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print { .no-print { display: none !important; } }
        @media (max-width: 768px) {
          .editor-layout { flex-direction: column; }
          .side-btns { flex-direction: row !important; justify-content: flex-end; padding-top: 0 !important; }
          .side-btns button { width: auto !important; }
          .history-panel { margin-top: 1.5rem; }
        }
        @media(max-width:700px){ .responsive-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* ── FIX NAVBAR: sticky para que nunca se mueva al hacer scroll ── */}
        <div
          className="no-print"
          style={{ position: "sticky", top: 0, zIndex: 50 }}
        >
          <Navbar />
        </div>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* ══ VISTA: LISTA ══════════════════════════════════════════════ */}
          {view === "list" && (
            <div>
              {/* Header — mismo estilo que dashboard */}
              <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: pink }}
                >
                  <User size={22} color="#fff" />
                </div>
                <div className="flex-1">
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-0.5"
                    style={{ color: pink }}
                  >
                    Sistema de expedientes
                  </p>
                  <h1 className="text-2xl font-black text-gray-800 leading-tight">
                    Pacientes
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Gestión de expedientes clínicos
                  </p>
                </div>
                <button
                  onClick={() => {
                    setForm({ full_name: "", age: "" });
                    setFormError("");
                    setView("register");
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${pink} 0%, ${roseDust} 100%)`,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={16} /> Nuevo paciente
                </button>
              </div>

              <div
                className="responsive-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(260px,2fr) 3fr",
                  gap: "1.5rem",
                }}
              >
                {/* ── Lista ── */}
                <div>
                  <div style={{ position: "relative", marginBottom: 14 }}>
                    <Search
                      size={15}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: roseDust,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowAll(false);
                      }}
                      className="w-full bg-white text-gray-800 text-sm rounded-xl outline-none"
                      style={{
                        paddingLeft: 36,
                        paddingRight: 14,
                        paddingTop: 10,
                        paddingBottom: 10,
                        border: `1.5px solid ${roseBorder}`,
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    ref={menuRef}
                  >
                    <div className="patient-list-scroll">
                      {displayed.length === 0 ? (
                        <div className="py-10 text-center">
                          <User
                            size={28}
                            style={{ color: "#e8c4cf", margin: "0 auto 8px" }}
                          />
                          <p className="text-sm text-gray-400">
                            Sin pacientes registrados
                          </p>
                        </div>
                      ) : (
                        displayed.map((patient, idx) => (
                          <div
                            key={patient.id}
                            onClick={() => setSelectedListPatient(patient)}
                            className="flex items-center justify-between cursor-pointer"
                            style={{
                              padding: "13px 16px",
                              borderBottom:
                                idx < displayed.length - 1
                                  ? `1px solid ${roseLight}`
                                  : "none",
                              background:
                                selectedListPatient?.id === patient.id
                                  ? roseLight
                                  : "transparent",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (selectedListPatient?.id !== patient.id)
                                (
                                  e.currentTarget as HTMLDivElement
                                ).style.background = "#fef7f9";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.background =
                                selectedListPatient?.id === patient.id
                                  ? roseLight
                                  : "transparent";
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "50%",
                                  background: `linear-gradient(135deg, ${pink}, ${roseDust})`,
                                }}
                              >
                                {patient.full_name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800 m-0">
                                  {patient.full_name}
                                </p>
                                <p className="text-xs text-gray-400 m-0">
                                  {patient.age ? `${patient.age} años` : "—"}
                                </p>
                              </div>
                            </div>

                            <div
                              style={{ position: "relative" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  setMenuOpenId(
                                    menuOpenId === patient.id
                                      ? null
                                      : patient.id,
                                  )
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 6,
                                  color: roseDust,
                                  display: "flex",
                                  borderRadius: 8,
                                }}
                              >
                                <MoreVertical size={15} />
                              </button>
                              {menuOpenId === patient.id && (
                                <div
                                  className="absolute right-0 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                                  style={{
                                    top: "100%",
                                    marginTop: 4,
                                    width: 210,
                                    zIndex: 30,
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      openEditorForPatient(patient);
                                    }}
                                    className="w-full text-left flex items-center gap-2 text-sm"
                                    style={{
                                      padding: "11px 16px",
                                      background: "none",
                                      border: "none",
                                      borderBottom: `1px solid ${roseLight}`,
                                      cursor: "pointer",
                                      color: pink,
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        "#fef7f9")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        "none")
                                    }
                                  >
                                    {isWithin24h(
                                      patientFollowupsMap[patient.id] ?? [],
                                    ) ? (
                                      <>
                                        <Edit2 size={13} /> Editar seguimiento
                                      </>
                                    ) : (
                                      <>
                                        <Plus size={13} /> Nuevo seguimiento
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteConfirm(patient);
                                      setMenuOpenId(null);
                                    }}
                                    className="w-full text-left flex items-center gap-2 text-sm"
                                    style={{
                                      padding: "11px 16px",
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      color: "#e53935",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        "#fff5f5")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        "none")
                                    }
                                  >
                                    <Trash2 size={13} /> Eliminar paciente
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {filtered.length > 5 && (
                      <div className="border-t border-gray-100 p-3">
                        <button
                          onClick={() => setShowAll((v) => !v)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{
                            background: `linear-gradient(135deg, ${pink} 0%, ${roseDust} 100%)`,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {showAll ? (
                            <>
                              <ChevronUp size={14} /> Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown size={14} /> Ver todos (
                              {filtered.length})
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Historial ── */}
                <div className="history-panel">
                  {selectedListPatient ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center text-white font-bold text-sm"
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${pink}, ${roseDust})`,
                            }}
                          >
                            {selectedListPatient.full_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800 m-0 text-base">
                              {selectedListPatient.full_name}
                            </h3>
                            <p className="text-xs text-gray-400 m-0">
                              {selectedListPatient.age
                                ? `${selectedListPatient.age} años`
                                : "Edad no registrada"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            openEditorForPatient(selectedListPatient)
                          }
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{
                            background: `linear-gradient(135deg, ${pink} 0%, ${roseDust} 100%)`,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          {isWithin24h(
                            patientFollowupsMap[selectedListPatient.id] ?? [],
                          ) ? (
                            <>
                              <Edit2 size={13} /> Editar seguimiento
                            </>
                          ) : (
                            <>
                              <Plus size={13} /> Nuevo seguimiento
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div
                          className="w-1 h-5 rounded-full"
                          style={{ background: pink }}
                        />
                        <p
                          className="text-xs font-bold uppercase tracking-widest m-0"
                          style={{ color: roseDust }}
                        >
                          Historial de citas
                        </p>
                      </div>

                      {!patientFollowupsMap[selectedListPatient.id]?.length ? (
                        <div className="py-8 text-center">
                          <Calendar
                            size={26}
                            style={{ color: "#e8c4cf", margin: "0 auto 8px" }}
                          />
                          <p className="text-sm text-gray-400">
                            Sin seguimientos registrados
                          </p>
                        </div>
                      ) : (
                        <ol className="list-none m-0 p-0 flex flex-col gap-2">
                          {patientFollowupsMap[selectedListPatient.id].map(
                            (f, idx) => {
                              const { weekday, date, year } = formatHistoryDate(
                                f.created_at,
                              );
                              const isLatest = idx === 0;
                              return (
                                <li
                                  key={f.id}
                                  className="flex items-center gap-3 rounded-xl"
                                  style={{
                                    padding: "10px 14px",
                                    background: isLatest ? roseLight : rosePale,
                                  }}
                                >
                                  <div
                                    className="flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: "50%",
                                      background: isLatest ? pink : roseDust,
                                    }}
                                  >
                                    {f.sheet_number}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800 m-0 capitalize">
                                      {weekday}
                                    </p>
                                    <p className="text-xs text-gray-400 m-0">
                                      {date} · {year}
                                    </p>
                                  </div>
                                  {isLatest && (
                                    <span
                                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                                      style={{
                                        background: roseLight,
                                        color: pink,
                                      }}
                                    >
                                      Última Cita
                                    </span>
                                  )}
                                </li>
                              );
                            },
                          )}
                        </ol>
                      )}
                    </div>
                  ) : (
                    <div
                      className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
                      style={{ minHeight: 280, padding: "4rem 2rem" }}
                    >
                      <User
                        size={38}
                        style={{ color: "#e8c4cf", marginBottom: 10 }}
                      />
                      <p className="text-sm text-gray-400">
                        Selecciona un paciente para ver su historial
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ VISTA: REGISTRO ═══════════════════════════════════════════ */}
          {view === "register" && (
            <div style={{ maxWidth: 480, margin: "0 auto" }}>
              <button
                onClick={() => setView("list")}
                className="flex items-center gap-2 mb-6 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: "transparent",
                  border: `1.5px solid ${roseBorder}`,
                  color: pink,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fef0f4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <ArrowLeft size={16} /> Volver a pacientes
              </button>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="mb-7">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1.5"
                    style={{ color: roseDust }}
                  >
                    Registro
                  </p>
                  <h2 className="text-2xl font-black text-gray-800 m-0">
                    Nuevo paciente
                  </h2>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          full_name: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-xl text-gray-800 outline-none text-sm"
                      style={{
                        padding: "12px 16px",
                        border: `1.5px solid ${roseBorder}`,
                        fontFamily: "inherit",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                      placeholder="NOMBRE APELLIDO"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Edad
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      inputMode="numeric"
                      value={form.age}
                      onKeyDown={(e) => {
                        if (
                          !/[0-9]|Backspace|Delete|Tab|ArrowLeft|ArrowRight/.test(
                            e.key,
                          )
                        )
                          e.preventDefault();
                      }}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          age: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="rounded-xl text-gray-800 outline-none text-sm"
                      style={{
                        width: 110,
                        padding: "12px 16px",
                        border: `1.5px solid ${roseBorder}`,
                        fontFamily: "inherit",
                      }}
                      placeholder="0–100"
                    />
                    {formError && (
                      <p
                        className="text-xs mt-1.5"
                        style={{ color: "#e53935" }}
                      >
                        {formError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${pink} 0%, ${roseDust} 100%)`,
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? "Registrando..." : "Registrar y abrir editor →"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ══ VISTA: EDITOR ═════════════════════════════════════════════ */}
          {view === "editor" && activePatient && (
            <div>
              {/* Header editor */}
              <div className="no-print mb-5 bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${pink}, ${roseDust})`,
                    }}
                  >
                    {activePatient.full_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-800 m-0 text-base">
                      {activePatient.full_name}
                    </h2>
                    <p className="text-xs text-gray-400 m-0">
                      {activePatient.age
                        ? `${activePatient.age} años`
                        : "Edad no registrada"}
                    </p>
                  </div>
                </div>

                {/* Dropdown fechas */}
                <div style={{ position: "relative" }} ref={dropdownRef}>
                  <button
                    onClick={() => setOpenDropdown((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{
                      background: "transparent",
                      border: `1.5px solid ${roseBorder}`,
                      color: pink,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#fef0f4")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Calendar size={14} />
                    {currentFollowup
                      ? formatDropdownDate(
                          currentFollowup.created_at,
                          true,
                        ).split(",")[0]
                      : "Fechas"}
                    {openDropdown ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                  </button>

                  {openDropdown && (
                    <div
                      className="absolute right-0 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                      style={{ marginTop: 6, width: 280, zIndex: 30 }}
                    >
                      {dropdownFollowups.map((f, idx) => {
                        const isLatest = idx === 0;
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              setCurrentFollowupId(f.id);
                              setEditingContent(f.content);
                              setOpenDropdown(false);
                            }}
                            className="w-full text-left flex items-center justify-between text-sm"
                            style={{
                              padding: "12px 16px",
                              background:
                                f.id === currentFollowupId
                                  ? roseLight
                                  : "transparent",
                              border: "none",
                              borderBottom:
                                idx < dropdownFollowups.length - 1
                                  ? `1px solid ${roseLight}`
                                  : "none",
                              cursor: "pointer",
                              color:
                                f.id === currentFollowupId ? pink : "#374151",
                            }}
                            onMouseEnter={(e) => {
                              if (f.id !== currentFollowupId)
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.background = "#fef7f9";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background =
                                f.id === currentFollowupId
                                  ? roseLight
                                  : "transparent";
                            }}
                          >
                            <span className="capitalize">
                              {formatDropdownDate(f.created_at, isLatest)}
                            </span>
                            {isLatest && (
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: roseLight, color: pink }}
                              >
                                Hoy
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Editor + botones */}
              <div className="editor-layout flex gap-4">
                <div className="flex-1 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
                  {currentFollowup && (
                    <SheetEditor
                      key={currentFollowup.id}
                      patientName={activePatient.full_name}
                      age={activePatient.age}
                      initialContent={currentFollowup.content}
                      sheetNumber={currentFollowup.sheet_number}
                      onSave={handleSaveContent}
                    />
                  )}
                </div>

                <div className="side-btns no-print flex flex-col gap-2.5 pt-1">
                  {[
                    {
                      icon: <Printer size={17} />,
                      label: "Imprimir",
                      onClick: handlePrint,
                      primary: false,
                    },
                    {
                      icon: isSaving ? (
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            border: "2px solid rgba(255,255,255,0.4)",
                            borderTopColor: "#fff",
                            borderRadius: "50%",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                      ) : (
                        <Check size={17} />
                      ),
                      label: isSaving ? "..." : "Terminar",
                      onClick: handleFinish,
                      primary: true,
                    },
                  ].map(({ icon, label, onClick, primary }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      title={label}
                      className="flex flex-col items-center gap-1.5 text-white text-xs font-semibold transition-opacity hover:opacity-85"
                      style={{
                        padding: "14px 10px",
                        borderRadius: 14,
                        border: "none",
                        cursor: "pointer",
                        width: 62,
                        background: primary
                          ? `linear-gradient(135deg, ${pink}, ${roseDust})`
                          : roseDust,
                        boxShadow: primary
                          ? "0 4px 14px rgba(194,24,91,0.3)"
                          : "0 2px 8px rgba(212,120,138,0.25)",
                      }}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal eliminación */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.28)",
            backdropFilter: "blur(4px)",
            zIndex: 50,
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl border border-gray-100 p-8"
            style={{ maxWidth: 380, width: "100%" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "#fff0f0" }}
              >
                <AlertTriangle size={20} style={{ color: "#e53935" }} />
              </div>
              <h3 className="font-bold text-gray-800 m-0 text-lg">
                Eliminar paciente
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Se eliminarán <strong>todos los datos y seguimientos</strong> de{" "}
              <strong>{deleteConfirm.full_name}</strong>. Esta acción no se
              puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: "transparent",
                  border: `1.5px solid ${roseBorder}`,
                  color: pink,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fef0f4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePatient(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{
                  background: "#e53935",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#c62828")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#e53935")
                }
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pacientes...</p>
        </div>
      </div>
    }>
      <PatientsPageContent />
    </Suspense>
  );
}