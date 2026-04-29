"use client"

import { useEffect, useMemo, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import {
  deleteVaultDocument, listVaultDocuments, putVaultDocument,
  type DocumentCategory, type VaultDocument,
} from "@/lib/document-vault"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AdminLangSwitcher from "@/components/admin-lang-switcher"
import StudentProfileDropdown from "@/components/student-profile-dropdown"
import StudentSmartSearch from "@/components/student-smart-search"
import ThemeToggle from "@/components/theme-toggle"
import StudentNotificationBell from "@/components/student-notification-bell"
import {
  GraduationCap, FileText, History, LogOut, Upload,
  Search, Download, Trash2, FolderOpen, X, CheckCircle2,
  ArrowLeft, RefreshCw, Filter
} from "lucide-react"

const CATEGORIES: DocumentCategory[] = [
  "Aadhaar","PAN","Photo","Signature","Income Certificate",
  "Caste Certificate","Domicile Certificate","Marksheet",
  "Bonafide Certificate","Bank Passbook","Admission Letter",
  "Fee Receipt","Disability Certificate","Other",
]

const CAT_COLORS: Record<string, string> = {
  "Aadhaar":               "#1a2744",
  "PAN":                   "#1e6fff",
  "Photo":                 "#7c3aed",
  "Signature":             "#0d9488",
  "Income Certificate":    "#f97316",
  "Caste Certificate":     "#dc2626",
  "Domicile Certificate":  "#059669",
  "Marksheet":             "#2563eb",
  "Bonafide Certificate":  "#0891b2",
  "Bank Passbook":         "#16a34a",
  "Admission Letter":      "#d97706",
  "Fee Receipt":           "#9333ea",
  "Disability Certificate":"#db2777",
  "Other":                 "#6b7280",
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return "-"
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export default function StudentDocumentsPage() {
  const { t } = useLanguage()
  const { data: session } = useSession()
  const studentName = session?.user?.name || "Student"

  const [docs, setDocs]           = useState<VaultDocument[]>([])
  const [loading, setLoading]     = useState(true)
  const [file, setFile]           = useState<File | null>(null)
  const [name, setName]           = useState("")
  const [category, setCategory]   = useState<DocumentCategory>("Other")
  const [notes, setNotes]         = useState("")
  const [saving, setSaving]       = useState(false)
  const [q, setQ]                 = useState("")
  const [catFilter, setCatFilter] = useState<DocumentCategory | "All">("All")
  const [toast, setToast]         = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)

  async function refresh() {
    setLoading(true)
    try { setDocs(await listVaultDocuments()) }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return docs.filter(d => {
      const catOk = catFilter === "All" || d.category === catFilter
      if (!catOk) return false
      if (!query) return true
      return `${d.name} ${d.category} ${d.originalFileName ?? ""} ${d.notes ?? ""}`.toLowerCase().includes(query)
    })
  }, [docs, q, catFilter])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setSaving(true)
    try {
      await putVaultDocument({ file, name, category, notes })
      setFile(null); setName(""); setCategory("Other"); setNotes("")
      setShowForm(false)
      await refresh()
      showToast("Document saved successfully!")
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    await deleteVaultDocument(id)
    await refresh()
    showToast("Document deleted.")
  }

  async function handleDownload(id: string) {
    const mod = await import("@/lib/document-vault")
    const row = await mod.getVaultDocument(id)
    if (!row) return
    const blob = new Blob([row.data], { type: row.mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = row.originalFileName || row.name
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const inputCls = "w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-background text-foreground hover:bg-muted/30 transition-colors"

  return (
    <div className="min-h-screen bg-background">

      {/* ── Navbar ── */}
      <div className="w-full px-6 py-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg,#1a2744 0%,#1e3a6e 100%)" }}>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-none">ScholarHub</p>
            <p className="text-blue-300 text-xs mt-0.5">Student Portal</p>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <StudentSmartSearch />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/student"
            className="inline-flex items-center rounded-xl px-2.5 py-2 text-white transition hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ArrowLeft size={15} />
          </Link>
          <AdminLangSwitcher />
          <ThemeToggle />
          <StudentNotificationBell />
          <StudentProfileDropdown />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <FolderOpen size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t("documentsVaultTitle") || "Document Vault"}</h1>
              <p className="text-sm text-gray-500">{t("documentsVaultSubtitle") || "Store scholarship documents safely on this device"}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition shadow-sm"
            style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
            <Upload size={15} /> {showForm ? "Cancel" : (t("uploadDocument") || "Upload Document")}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Documents", value: docs.length,                                          bg: "#1a2744",                                        sub: "text-blue-200"   },
            { label: "Aadhaar / PAN",   value: docs.filter(d=>["Aadhaar","PAN"].includes(d.category)).length, bg: "linear-gradient(135deg,#1e6fff,#2563eb)", sub: "text-blue-100"   },
            { label: "Certificates",    value: docs.filter(d=>d.category.includes("Certificate")).length,     bg: "linear-gradient(135deg,#f97316,#fbbf24)", sub: "text-orange-100" },
            { label: "Marksheets",      value: docs.filter(d=>d.category==="Marksheet").length,              bg: "linear-gradient(135deg,#0d9488,#0f766e)", sub: "text-teal-100"   },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-white shadow-sm" style={{ background: c.bg }}>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${c.sub}`}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Upload form */}
        {showForm && (
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <div className="flex items-center gap-2">
                <Upload size={15} className="text-blue-300" />
                <h2 className="text-sm font-bold text-white">{t("uploadDocument") || "Upload Document"}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/60 hover:text-white transition">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {/* File picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t("chooseFile") || "Choose File"}
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer"
                  onClick={() => document.getElementById("vault-file")?.click()}>
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600">
                      <FileText size={16} /> {file.name}
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}
                        className="text-gray-400 hover:text-red-500 ml-1"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">
                      <Upload size={20} className="mx-auto mb-1 text-gray-300" />
                      Click to choose a file
                    </div>
                  )}
                  <input id="vault-file" type="file" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {t("documentName") || "Document Name"}
                  </label>
                  <input className={inputCls} placeholder={t("documentNamePlaceholder") || "e.g. Income Certificate 2025"}
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {t("documentType") || "Document Type"}
                  </label>
                  <select className={inputCls} value={category}
                    onChange={e => setCategory(e.target.value as DocumentCategory)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t("notes") || "Notes"} <span className="text-gray-300 normal-case font-normal">(optional)</span>
                </label>
                <textarea className={inputCls} rows={2}
                  placeholder={t("notesPlaceholder") || "Optional notes..."}
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={!file || saving}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition shadow-sm"
                  style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                  {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Upload size={14} /> {t("saveDocument") || "Save Document"}</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="inline-flex items-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Documents list */}
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-4 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
            <div className="flex items-center gap-2">
              <FolderOpen size={15} className="text-blue-300" />
              <h2 className="text-sm font-bold text-white">{t("myDocuments") || "My Documents"}</h2>
              <span className="text-xs text-blue-300 bg-white/10 px-2 py-0.5 rounded-full ml-1">
                {filtered.length}{q || catFilter !== "All" ? ` / ${docs.length}` : ""}
              </span>
            </div>
            <button onClick={refresh} disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition">
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {/* Search & filter */}
          <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row gap-3 bg-muted/30">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="w-full pl-9 pr-9 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-background text-foreground"
                placeholder={t("searchDocuments") || "Search documents..."}
                value={q} onChange={e => setQ(e.target.value)} />
              {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
            </div>
            <div className="relative">
              <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white cursor-pointer"
                value={catFilter} onChange={e => setCatFilter(e.target.value as any)}>
                <option value="All">All Types</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Document", "Type", "Size", "Uploaded", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center">
                    <RefreshCw size={24} className="animate-spin mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">Loading documents...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center">
                    <FolderOpen size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm font-medium">
                      {docs.length === 0 ? (t("noDocuments") || "No documents saved yet.") : "No documents match your search."}
                    </p>
                    {docs.length === 0 && (
                      <button onClick={() => setShowForm(true)}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
                        style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                        <Upload size={14} /> Upload First Document
                      </button>
                    )}
                  </td></tr>
                ) : filtered.map((d, i) => (
                  <tr key={d.id} className={`hover:bg-blue-50/20 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-muted/30"}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: CAT_COLORS[d.category] || "#6b7280" }}>
                          {d.category.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{d.name}</p>
                          {d.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{d.notes}</p>}
                          {d.originalFileName && <p className="text-xs text-gray-300 mt-0.5">{d.originalFileName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold text-white"
                        style={{ background: CAT_COLORS[d.category] || "#6b7280" }}>
                        {d.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs font-medium">{formatBytes(d.size)}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleDownload(d.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                          style={{ background: "#0d9488" }}>
                          <Download size={11} /> {t("download") || "Download"}
                        </button>
                        <button onClick={() => handleDelete(d.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                          style={{ background: "#dc2626" }}>
                          <Trash2 size={11} /> {t("delete") || "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 rounded-2xl px-5 py-4 border border-blue-100"
          style={{ background: "rgba(30,111,255,0.04)" }}>
          <span className="text-lg flex-shrink-0">🔒</span>
          <p className="text-xs text-gray-500">
            Your documents are stored <strong>locally in your browser</strong> using IndexedDB. They are never uploaded to any server and remain private on this device.
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-card border border-green-200 rounded-2xl px-5 py-4 shadow-xl">
          <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-gray-900">{toast}</p>
        </div>
      )}
    </div>
  )
}
