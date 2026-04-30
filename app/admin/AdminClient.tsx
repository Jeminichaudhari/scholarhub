"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen, FileText, Plus, Pencil, Trash2,
  X, Users, TrendingUp, User, Shield, CheckCircle,
  Search, Filter, XCircle, LogOut, Globe
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import { useScholarshipStore } from "@/lib/use-scholarship-store";
import { signOut } from "next-auth/react";
import ThemeToggle from "@/components/theme-toggle";
import AdminProfileDropdown from "@/components/admin-profile-dropdown";
import AdminAIMonitor from "@/components/admin-ai-monitor";

interface Scholarship {
  _id: string;
  title: string;
  description: string;
  amount: number;
  deadline: string;
  isActive: boolean;
  applicants: string[];
  category: string[];
  eligibility: string;
}

const emptyForm = {
  title: "", description: "", amount: "", eligibility: "",
  deadline: "", applyLink: "", category: "General",
  maxIncome: "", level: "Central", state: "Any",
};

export default function AdminClient() {
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab] = useState<"scholarships" | "users" | "message" | "monitor">("scholarships");
  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState<{ text: string; ok: boolean } | null>(null);
  const { t } = useLanguage();

  // ── Search & Filter state ──────────────────────────────────────────────────
  const [schSearch, setSchSearch]       = useState("");
  const [schCategory, setSchCategory]   = useState("");
  const [schStatus, setSchStatus]       = useState<"" | "active" | "inactive">("");

  // Filtered scholarships
  const filteredScholarships = useMemo(() => {
    return scholarships.filter(s => {
      const translatedTitle = (() => { const tr = t(`sch${s._id}`); return tr && tr !== `sch${s._id}` ? tr : s.title; })();
      const matchSearch = !schSearch ||
        translatedTitle.toLowerCase().includes(schSearch.toLowerCase()) ||
        s.title.toLowerCase().includes(schSearch.toLowerCase()) ||
        s.eligibility?.toLowerCase().includes(schSearch.toLowerCase());
      const matchCat = !schCategory ||
        (Array.isArray(s.category) ? s.category.join(",") : s.category)
          .toLowerCase().includes(schCategory.toLowerCase());
      const matchStatus = !schStatus ||
        (schStatus === "active" ? s.isActive : !s.isActive);
      return matchSearch && matchCat && matchStatus;
    });
  }, [scholarships, schSearch, schCategory, schStatus]);

  // ── Shared store — same data as student dashboard ─────────────────────────
  const { scholarships: storeData, isLoaded: storeLoaded, addScholarship: storeAdd, deleteScholarship: storeDelete, updateScholarship: storeUpdate } = useScholarshipStore();

  useEffect(() => {
    if (!storeLoaded) return;
    setScholarships(storeData.map(s => ({
      _id:         s.id,
      title:       s.title,
      description: s.description,
      amount:      Number(s.amount.replace(/,/g, "")),
      deadline:    s.deadline,
      isActive:    new Date(s.deadline) >= new Date(), // inactive if deadline passed
      applicants:  [],
      category:    [s.category],
      eligibility: s.eligibility,
    })));
    setLoading(false);
  }, [storeData, storeLoaded]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);

    if (editingId) {
      // Update existing scholarship in store
      storeUpdate(editingId, {
        title:            form.title,
        description:      form.description,
        amount:           form.amount,
        eligibility:      form.eligibility,
        deadline:         form.deadline,
        category:         form.category,
        applyLink:        form.applyLink,
        maxIncome:        (form as any).maxIncome || "",
        level:            (form as any).level || "Central",
        scholarshipState: (form as any).state || "Any",
      });
      setMsg({ text: "Scholarship updated successfully!", ok: true });

      // Notify all students about the update
      try {
        const res = await fetch("/api/scholarships/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:       `[Updated] ${form.title}`,
            description: form.description,
            eligibility: form.eligibility,
            amount:      form.amount,
            deadline:    form.deadline,
            category:    form.category,
            applyLink:   form.applyLink,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMsg({ text: `Scholarship updated! Email sent to ${data.sent} student(s).`, ok: true });
        }
      } catch {
        // Email failed silently
      }
    } else {
      // Add new scholarship
      storeAdd({
        title:            form.title,
        description:      form.description,
        amount:           form.amount,
        eligibility:      form.eligibility,
        deadline:         form.deadline,
        category:         form.category,
        provider:         "Admin",
        level:            (form as any).level || "Central",
        course:           "College",
        scholarshipState: (form as any).state || "Any",
        applyLink:        form.applyLink,
        youtubeLink:      "",
        maxIncome:        (form as any).maxIncome || "",
      });
      setMsg({ text: "Scholarship added successfully!", ok: true });

      // Notify all students by email
      try {
        const res = await fetch("/api/scholarships/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:       form.title,
            description: form.description,
            eligibility: form.eligibility,
            amount:      form.amount,
            deadline:    form.deadline,
            category:    form.category,
            applyLink:   form.applyLink,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMsg({ text: `Scholarship added! Email sent to ${data.sent} student(s).`, ok: true });
        }
      } catch {
        // Email failed silently — scholarship still saved
      }
    }

    setSaving(false);
    setForm(emptyForm); setShowForm(false); setEditingId(null);
  }

  function handleEdit(s: typeof scholarships[0]) {
    // Find full data from store to preserve description and applyLink
    const storeItem = storeData.find(x => x.id === s._id);
    setForm({
      title:       s.title,
      description: storeItem?.description || "",
      amount:      String(s.amount),
      eligibility: s.eligibility || "",
      deadline:    s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "",
      applyLink:   storeItem?.applyLink || "",
      category:    Array.isArray(s.category) ? s.category[0] : s.category,
      maxIncome:   storeItem?.maxIncome || "",
      level:       storeItem?.level || "Central",
      state:       storeItem?.scholarshipState || "Any",
    } as any);
    setEditingId(s._id);
    setShowForm(true);
    // Scroll to form
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  function handleDelete(id: string) { storeDelete(id); }

  function handleCancel() { setShowForm(false); setEditingId(null); setForm(emptyForm); }

  const activeCount = scholarships.filter(s => s.isActive).length;
  const abroadCount = 18; // static abroad scholarships (see /admin/abroad)
  const [totalUsers, setTotalUsers] = useState(0);
  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => setTotalUsers(d.users?.length || 0)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Admin Navbar ── */}
      <div className="w-full px-6 py-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg,#1a2744 0%,#1e3a6e 100%)" }}>
        {/* Left — logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <Shield size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-none">ScholarHub</p>
            <p className="text-blue-300 text-xs mt-0.5">Admin Dashboard</p>
          </div>
        </div>

        {/* Center — search */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search scholarships..."
              value={schSearch}
              onChange={e => setSchSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/10 text-white placeholder-blue-300 border border-white/20 focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Right — lang + theme + profile dropdown */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <AdminLangSwitcher />
          <ThemeToggle />
          <AdminProfileDropdown />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 overflow-hidden">

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<BookOpen size={22} />}   label={t("totalScholarships")}  value={scholarships.length} bg="#1a2744"                                 sub="text-blue-200" onClick={() => setActiveTab("scholarships")} />
          <StatCard icon={<TrendingUp size={22} />} label={t("activeScholarships")} value={activeCount}         bg="linear-gradient(135deg,#1e6fff,#2563eb)" sub="text-blue-100" onClick={() => setActiveTab("scholarships")} />
          <StatCard icon={<Globe size={22} />}      label="Abroad Scholarships"     value={abroadCount}         bg="linear-gradient(135deg,#7c3aed,#6d28d9)" sub="text-purple-200" onClick={() => router.push("/admin/abroad")} />
          <StatCard icon={<Users size={22} />}      label="Registered Users"        value={totalUsers}          bg="linear-gradient(135deg,#0d9488,#0f766e)" sub="text-teal-100" onClick={() => setActiveTab("users")} />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 rounded-xl p-1 mb-6 w-full" style={{ background: "#e2e8f0" }}>
          {(["scholarships", "users", "message", "monitor"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab === "scholarships" ? t("manageScholarships")
                : tab === "users"    ? "Registered Users"
                : tab === "message"  ? "📢 Send Message"
                :                      "🤖 AI Monitor"}
            </button>
          ))}
        </div>

        {/* ── Scholarships Tab ── */}
        {activeTab === "scholarships" && (
          <div className="rounded-2xl overflow-hidden shadow-md w-full min-w-0">
            {/* Navy header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-blue-300" />
                <h2 className="text-sm font-bold text-white">{t("allScholarships2")}</h2>
                <span className="text-xs text-blue-300 bg-white/10 px-2 py-0.5 rounded-full ml-1">
                  {filteredScholarships.length}{schSearch || schCategory || schStatus ? ` / ${scholarships.length}` : ""}
                </span>
              </div>
              <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#1e6fff" }}>
                <Plus size={15} /> {t("addScholarship2")}
              </button>
            </div>

            {/* Search & Filter bar — always visible below header */}
            <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row gap-3 bg-white">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or eligibility..."
                  value={schSearch}
                  onChange={e => setSchSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                />
                {schSearch && (
                  <button onClick={() => setSchSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              {/* Category filter */}
              <select value={schCategory} onChange={e => setSchCategory(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 cursor-pointer">
                <option value="">All Categories</option>
                {["General", "SC", "ST", "OBC", "EWS", "All"].map(c => <option key={c}>{c}</option>)}
              </select>
              {/* Status filter */}
              <select value={schStatus} onChange={e => setSchStatus(e.target.value as any)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 cursor-pointer">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {/* Clear + count */}
              {(schSearch || schCategory || schStatus) && (
                <button onClick={() => { setSchSearch(""); setSchCategory(""); setSchStatus(""); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition whitespace-nowrap">
                  <XCircle size={14} /> Clear
                </button>
              )}
              <span className="hidden sm:flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 whitespace-nowrap">
                {filteredScholarships.length} / {scholarships.length}
              </span>
            </div>

            {/* Add form */}
            {showForm && (
              <div className="border-b border-gray-100 px-5 py-5" style={{ background: "var(--muted)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">{editingId ? t("editScholarship") : t("newScholarship")}</h3>
                  <button onClick={handleCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 transition">
                    <X size={16} />
                  </button>
                </div>
                {msg && (
                  <div className={`rounded-xl px-4 py-2.5 text-sm mb-4 border ${msg.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {msg.text}
                  </div>
                )}
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: "Scholarship Title", key: "title",       type: "text",   ph: "e.g. PM Scholarship 2025" },
                      { label: "Amount (₹)",        key: "amount",      type: "number", ph: "e.g. 50000" },
                      { label: "Eligibility",       key: "eligibility", type: "text",   ph: "e.g. 12th pass, income < 2.5L" },
                      { label: "Deadline",          key: "deadline",    type: "date",   ph: "" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                        <input required type={f.type} placeholder={f.ph}
                          value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        {["General", "SC", "ST", "OBC", "EWS", "All"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Apply Link (optional)</label>
                      <input type="url" placeholder="https://scholarships.gov.in/..."
                        value={form.applyLink} onChange={e => setForm({ ...form, applyLink: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Max. Family Income (₹/year)</label>
                      <input type="number" placeholder="e.g. 250000"
                        value={(form as any).maxIncome} onChange={e => setForm({ ...form, maxIncome: e.target.value } as any)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Level</label>
                      <select value={(form as any).level} onChange={e => setForm({ ...form, level: e.target.value } as any)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        {["Central", "State", "Trust", "NGO"].map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">State</label>
                      <input type="text" placeholder="e.g. Gujarat, Any"
                        value={(form as any).state} onChange={e => setForm({ ...form, state: e.target.value } as any)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                    <textarea required rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 shadow-sm"
                      style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                      {saving ? "Saving..." : "Save Scholarship"}
                    </button>
                    <button type="button" onClick={handleCancel}
                      className="inline-flex items-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--muted)", borderBottom: "2px solid #e2e8f0" }}>
                    {[t("scholarshipCol"), t("scholarshipCategory"), t("amountCol"), t("deadlineCol"), t("statusCol"), t("actionsCol")].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">Loading...</td></tr>
                  ) : filteredScholarships.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <Search size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-400 text-sm">
                          {scholarships.length === 0 ? t("noScholarshipsYet") : "No scholarships match your search."}
                        </p>
                        {scholarships.length > 0 && (
                          <button onClick={() => { setSchSearch(""); setSchCategory(""); setSchStatus(""); }}
                            className="mt-2 text-xs text-blue-500 hover:underline">Clear filters</button>
                        )}
                      </td>
                    </tr>
                  ) : filteredScholarships.map((s, i) => (
                    <tr key={s._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {(() => { const tr = t(`sch${s._id}`); return tr && tr !== `sch${s._id}` ? tr : s.title; })()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.eligibility}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold text-white"
                          style={{ background: "#1a2744" }}>
                          {Array.isArray(s.category) ? s.category.join(", ") : s.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">₹{s.amount?.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{new Date(s.deadline).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          s.isActive ? "text-white" : "bg-gray-100 text-gray-500"
                        }`} style={s.isActive ? { background: "linear-gradient(135deg,#0d9488,#0f766e)" } : {}}>
                          {s.isActive ? <><CheckCircle size={10} /> Active</> : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(s)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                            style={{ background: "#0d9488" }}>
                            <Pencil size={11} /> {t("edit")}
                          </button>
                          <button onClick={() => handleDelete(s._id)}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                            style={{ background: "#dc2626" }}>
                            <Trash2 size={11} /> {t("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === "users" && (
          <UsersTab />
        )}

        {/* ── Message Tab ── */}
        {activeTab === "message" && (
          <MessageTab />
        )}

        {/* ── AI Monitor Tab ── */}
        {activeTab === "monitor" && (
          <AdminAIMonitor />
        )}

      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers]   = useState<{ _id: string; name: string; email: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="rounded-2xl overflow-hidden shadow-md w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-300" />
          <h2 className="text-sm font-bold text-white">Registered Students</h2>
          <span className="text-xs text-blue-300 bg-white/10 px-2 py-0.5 rounded-full ml-1">
            {filtered.length}{search ? ` / ${users.length}` : ""}
          </span>
        </div>
        <span className="text-xs text-blue-200 bg-white/10 px-2.5 py-1 rounded-full">
          {users.length} total users
        </span>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b border-gray-100 bg-white">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--muted)", borderBottom: "2px solid #e2e8f0" }}>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">#</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Username</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Email</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">Loading users...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">{users.length === 0 ? "No students registered yet." : "No users match your search."}</p>
                </td>
              </tr>
            ) : filtered.map((u, i) => (
              <tr key={u._id} className={`hover:bg-blue-50/20 transition-colors ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                <td className="px-5 py-4 text-gray-400 text-xs font-medium">{i + 1}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#1a2744,#1e6fff)" }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-900">{u.name}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-sm">{u.email}</td>
                <td className="px-5 py-4 text-gray-400 text-xs">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const NOTIF_CATEGORIES = ["All","General","OBC","SC","ST","Minority","EWS","Girls"];
const NOTIF_TYPES = [
  { key:"info",    label:"Info",    color:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
  { key:"success", label:"Success", color:"#16a34a", bg:"#f0fdf4", border:"#bbf7d0" },
  { key:"warning", label:"Warning", color:"#d97706", bg:"#fffbeb", border:"#fde68a" },
  { key:"urgent",  label:"Urgent",  color:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
];

interface Notif {
  id: string; scholarship: string; category: string; sendTo: string;
  title: string; type: string; message: string; createdAt: string; sent: number;
}

function MessageTab() {
  const { scholarships: storeScholarships } = useScholarshipStore();
  const [scholarship, setScholarship] = useState("all");
  const [sendTo, setSendTo]           = useState("All");
  const [personalEmail, setPersonalEmail] = useState("");
  const [title, setTitle]             = useState("");
  const [type, setType]               = useState("info");
  const [message, setMessage]         = useState("");
  const [sending, setSending]         = useState(false);
  const [result, setResult]           = useState<{ ok: boolean; text: string } | null>(null);
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [scholarships, setScholarships]   = useState<{ _id: string; title: string }[]>([]);

  const [studentMessages, setStudentMessages] = useState<{ _id: string; name: string; email: string; subject: string; message: string; read: boolean; createdAt: string }[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/contact")
      .then(r => r.json())
      .then(d => {
        setStudentMessages(d.messages || []);
        setUnread((d.messages || []).filter((m: any) => !m.read).length);
        setMsgsLoading(false);
      })
      .catch(() => setMsgsLoading(false));
  }, []);

  const [replyTo, setReplyTo] = useState<{ _id: string; name: string; email: string; subject: string } | null>(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyResult, setReplyResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyTo || !replyMsg) return;
    setReplying(true); setReplyResult(null);
    try {
      const res = await fetch("/api/contact/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: replyTo.email, name: replyTo.name, subject: replyTo.subject, message: replyMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplyResult({ ok: true, text: `✅ Reply sent to ${replyTo.email}` });
        setReplyMsg("");
        setTimeout(() => { setReplyTo(null); setReplyResult(null); }, 2000);
      } else {
        setReplyResult({ ok: false, text: `❌ ${data.message || "Failed"}` });
      }
    } catch {
      setReplyResult({ ok: false, text: "❌ Network error" });
    }
    setReplying(false);
  }

  async function deleteMsg(id: string) {
    await fetch("/api/contact", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setStudentMessages(prev => prev.filter(m => m._id !== id));
  }

  useEffect(() => {
    fetch("/api/scholarships").then(r => r.json()).then(d => setScholarships(d.scholarships || [])).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true); setResult(null);
    try {
      const sch = storeScholarships.find(s => s.id === scholarship);
      const res = await fetch("/api/scholarships/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: message,
          eligibility: sendTo !== "All" ? sendTo : "",
          amount: "", deadline: "", category: sendTo, applyLink: "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const newNotif: Notif = {
          id: Date.now().toString(),
          scholarship: sch?.title || (scholarship.startsWith("abroad-") ? "Abroad Scholarship" : "All Students"),
          category: sendTo,
          sendTo: sendTo === "Personal" ? personalEmail : sendTo,
          title, type, message,
          createdAt: new Date().toLocaleString("en-IN"),
          sent: data.sent || 0,
        };
        setNotifications(prev => [newNotif, ...prev]);
        setResult({ ok: true, text: `✅ Notification sent to ${data.sent} student(s).` });
        setTitle(""); setMessage(""); setSendTo("All"); setScholarship("all"); setType("info"); setPersonalEmail("");
      } else {
        setResult({ ok: false, text: `❌ ${data.message || "Failed to send"}` });
      }
    } catch {
      setResult({ ok: false, text: "❌ Network error. Please try again." });
    }
    setSending(false);
  }

  function deleteNotif(id: string) { setNotifications(prev => prev.filter(n => n.id !== id)); }

  const inp = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900 transition-colors";
  const lbl = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-6">

      {/* ── Create Notification Card ── */}
      <div className="bg-card rounded-2xl shadow-md overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: "rgba(255,255,255,0.12)" }}>📢</div>
            <div>
              <h2 className="text-sm font-bold text-white">New Notification</h2>
              <p className="text-blue-300 text-xs mt-0.5">Send announcements to students</p>
            </div>
          </div>
          <span className="text-xs text-blue-200 bg-white/10 px-3 py-1 rounded-full font-semibold">
            {notifications.length} sent
          </span>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {result && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${result.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {result.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Scholarship dropdown */}
            <div>
              <label className={lbl}>Select Scholarship</label>
              <select value={scholarship} onChange={e => setScholarship(e.target.value)} className={inp}>
                <option value="all">📋 All Registered Students</option>
                <optgroup label="─── 🇮🇳 Indian Scholarships ───">
                  {storeScholarships.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </optgroup>
                <optgroup label="─── ✈️ Abroad Scholarships ───">
                  <option value="abroad-s1">Fulbright-Nehru Master's Fellowships</option>
                  <option value="abroad-s2">Fulbright-Nehru Doctoral Fellowships</option>
                  <option value="abroad-s3">Inlaks Shivdasani Foundation Scholarship</option>
                  <option value="abroad-s4">Tata Scholarship for Cornell University</option>
                  <option value="abroad-s5">AAUW International Fellowship</option>
                  <option value="abroad-s6">Chevening Scholarships</option>
                  <option value="abroad-s7">Gates Cambridge Scholarship</option>
                  <option value="abroad-s8">Commonwealth Scholarships UK</option>
                  <option value="abroad-s9">Felix Scholarship</option>
                  <option value="abroad-s10">Vanier Canada Graduate Scholarships</option>
                  <option value="abroad-s11">Ontario Graduate Scholarship</option>
                  <option value="abroad-s12">Shastri Indo-Canadian Institute Fellowship</option>
                  <option value="abroad-s13">Australia Awards Scholarships</option>
                  <option value="abroad-s14">Research Training Program (RTP)</option>
                  <option value="abroad-s15">University of Melbourne Graduate Research Scholarship</option>
                  <option value="abroad-s16">DAAD Scholarships</option>
                  <option value="abroad-s17">Deutschlandstipendium</option>
                  <option value="abroad-s18">Konrad-Adenauer-Stiftung Scholarship</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {scholarship === "all"
                  ? "Email goes to all registered students"
                  : scholarship.startsWith("abroad-")
                    ? "Abroad scholarship — email goes to all students"
                    : "Email goes to applicants of this scholarship"}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className={lbl}>Notification Title *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New Scholarship Available!"
                className={inp} />
            </div>
          </div>

          {/* Send To */}
          <div>
            <label className={lbl}>Send To</label>
            <div className="flex flex-wrap gap-2">
              {["Personal", ...NOTIF_CATEGORIES].map(cat => (
                <button key={cat} type="button" onClick={() => setSendTo(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    sendTo === cat ? "text-white border-transparent shadow-sm" : "text-gray-600 border-gray-200 bg-white hover:border-blue-300"
                  }`}
                  style={sendTo === cat ? { background: "linear-gradient(135deg,#1e6fff,#2563eb)" } : {}}>
                  {cat === "Personal" ? "✉️ Personal" : cat}
                </button>
              ))}
            </div>
            {sendTo === "Personal" && (
              <input value={personalEmail} onChange={e => setPersonalEmail(e.target.value)}
                placeholder="student@email.com"
                className={`${inp} mt-2`} type="email" />
            )}
          </div>

          {/* Type */}
          <div>
            <label className={lbl}>Notification Type</label>
            <div className="flex flex-wrap gap-2">
              {NOTIF_TYPES.map(t => (
                <button key={t.key} type="button" onClick={() => setType(t.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    type === t.key ? "shadow-sm" : "bg-white hover:opacity-80"
                  }`}
                  style={type === t.key
                    ? { background: t.bg, color: t.color, borderColor: t.border }
                    : { background: "#f8fafc", color: "#64748b", borderColor: "#e2e8f0" }}>
                  {t.key === "info" ? "ℹ️" : t.key === "success" ? "✅" : t.key === "warning" ? "⚠️" : "🚨"} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className={lbl}>Message *</label>
            <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="This message will appear in the student panel."
              className={`${inp} resize-y`} />
            <p className="text-xs text-gray-400 mt-1">{message.length} characters</p>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
            <button type="submit" disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition shadow-sm"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#1a2744" }}>
              {sending
                ? <><span className="w-4 h-4 border-2 border-yellow-900/30 border-t-yellow-900 rounded-full animate-spin" />Sending...</>
                : <>📤 Create Notification</>}
            </button>
            <p className="text-xs text-gray-400">
              {sendTo === "Personal" ? `Sending to: ${personalEmail || "—"}` : `Sending to: ${sendTo === "All" ? "all students" : `${sendTo} category`}`}
            </p>
          </div>
        </form>
      </div>

      {/* ── All Notifications ── */}
      <div className="bg-card rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">🔔</span>
            <h2 className="text-sm font-bold text-white">All Notifications</h2>
            <span className="text-xs text-blue-300 bg-white/10 px-2 py-0.5 rounded-full ml-1">{notifications.length}</span>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-400 text-sm font-medium">No notifications sent yet.</p>
            <p className="text-gray-300 text-xs mt-1">Create one above to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--muted)", borderBottom: "2px solid #e2e8f0" }}>
                  {["Title", "Type", "Sent To", "Scholarship", "Recipients", "Date", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((n, i) => {
                  const t = NOTIF_TYPES.find(x => x.key === n.type) || NOTIF_TYPES[0];
                  return (
                    <tr key={n.id} className={`hover:bg-muted/30 transition-colors ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border"
                          style={{ background: t.bg, color: t.color, borderColor: t.border }}>
                          {t.key === "info" ? "ℹ️" : t.key === "success" ? "✅" : t.key === "warning" ? "⚠️" : "🚨"} {t.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {n.sendTo}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500">{n.scholarship}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                          ✓ {n.sent} sent
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{n.createdAt}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => deleteNotif(n.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Student Messages ── */}
      <div className="bg-card rounded-2xl shadow-md overflow-hidden border border-gray-100">
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm">💬</span>
            <h2 className="text-sm font-bold text-white">Student Messages</h2>
            <span className="text-xs text-blue-300 bg-white/10 px-2 py-0.5 rounded-full ml-1">{studentMessages.length}</span>
            {unread > 0 && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{unread} new</span>
            )}
          </div>
        </div>

        {msgsLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading messages...</div>
        ) : studentMessages.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-400 text-sm font-medium">No student messages yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {studentMessages.map(m => (
              <div key={m._id} className={`p-5 transition-colors ${!m.read ? "bg-blue-50/40" : "bg-card"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                      </div>
                      <p className="text-xs text-blue-600 mt-0.5">{m.email}</p>
                      <p className="text-xs font-semibold text-gray-700 mt-1">📌 {m.subject}</p>
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{m.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(m.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!m.read && (
                      <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                    )}
                    <button onClick={() => { setReplyTo({ _id: m._id, name: m.name, email: m.email, subject: m.subject }); setReplyMsg(""); }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition"
                      style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                      Reply
                    </button>
                    <button onClick={() => deleteMsg(m._id)}
                      className="text-gray-300 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reply Modal ── */}
      {replyTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setReplyTo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <div>
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide">Reply to Student</p>
                <p className="text-white font-bold text-sm mt-0.5">{replyTo.name} — {replyTo.email}</p>
                <p className="text-blue-300 text-xs mt-0.5">Re: {replyTo.subject}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={sendReply} className="p-5 space-y-4">
              {replyResult && (
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold border ${replyResult.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {replyResult.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Your Reply</label>
                <textarea required rows={5} value={replyMsg} onChange={e => setReplyMsg(e.target.value)}
                  placeholder={`Write your reply to ${replyTo.name}...`}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white text-gray-900 resize-y" />
              </div>
              <div className="flex gap-3 pt-1 border-t border-gray-100">
                <button type="submit" disabled={replying}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition"
                  style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                  {replying ? "Sending..." : "Send Reply"}
                </button>
                <button type="button" onClick={() => setReplyTo(null)}
                  className="inline-flex items-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg, sub, onClick }: {
  icon: React.ReactNode; label: string; value: number; bg: string; sub: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`rounded-2xl p-5 shadow-sm text-white relative overflow-hidden ${onClick ? "cursor-pointer hover:opacity-90 transition" : ""}`} style={{ background: bg }}>
      <div className="absolute right-4 top-4 opacity-10 scale-150">{icon}</div>
      <div className="relative">
        <div className="mb-3 opacity-80">{icon}</div>
        <p className="text-3xl font-bold">{value}</p>
        <p className={`text-xs font-semibold uppercase tracking-wide mt-1 ${sub}`}>{label}</p>
      </div>
    </div>
  );
}
