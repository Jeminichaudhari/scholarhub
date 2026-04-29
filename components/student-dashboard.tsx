"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, X, CheckCircle2, Calendar, IndianRupee, Users, Tag, History, ChevronRight, Search, Bell, Bookmark, Globe } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useScholarshipStore } from "@/lib/use-scholarship-store";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import StudentProfileDropdown from "@/components/student-profile-dropdown";
import StudentSmartSearch from "@/components/student-smart-search";
import ThemeToggle from "@/components/theme-toggle";
import StudentNotificationBell from "@/components/student-notification-bell";

export default function StudentDashboard() {
  const { t } = useLanguage();
  const { scholarships: storeScholarships, isLoaded, applications } = useScholarshipStore();
  const { data: session } = useSession();
  const studentName  = session?.user?.name  || "Student";
  const studentEmail = session?.user?.email || "";

  const [income]    = useState(0);
  const [category, setCategory] = useState("");
  const [course, setCourse]     = useState("");
  const [state, setState]       = useState("");
  const [level, setLevel]       = useState<"" | "Central" | "State" | "Trust">("");
  const [navSearch, setNavSearch] = useState("");
  const searchParams = useSearchParams();
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setNavSearch(q);
  }, [searchParams]);

  const [showResults, setShowResults] = useState(true);

  // Reminders panel toggle
  const [showRemindersPanel, setShowRemindersPanel] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Bookmarks — stored in localStorage
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("scholarhub_bookmarks") || "[]");
      setBookmarks(new Set(saved));
    } catch {}
  }, []);

  function toggleBookmark(id: string) {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("scholarhub_bookmarks", JSON.stringify([...next]));
      return next;
    });
  }

  // Modal state
  const [detailScholarship, setDetailScholarship] = useState<any>(null);

  const [reminders, setReminders]             = useState<Map<string, number[]>>(new Map());
  const [reminderLoading, setReminderLoading] = useState<string | null>(null);
  const [reminderPopup, setReminderPopup]     = useState<any>(null);
  const [selectedDates, setSelectedDates]     = useState<Date[]>([]);
  const [calMonth, setCalMonth]               = useState<Date>(new Date());
  const [reminderTime, setReminderTime]       = useState("09:00"); // default 9 AM

  // Load existing reminders on mount — localStorage first, then MongoDB
  useEffect(() => {
    // Load from localStorage immediately
    try {
      const local = JSON.parse(localStorage.getItem("scholarhub_reminders") || "{}");
      const map = new Map<string, number[]>();
      Object.values(local).forEach((r: any) => map.set(r.scholarshipId, r.reminderDays));
      if (map.size > 0) setReminders(map);
    } catch {}

    // Also try MongoDB
    fetch("/api/reminders")
      .then(r => r.json())
      .then(d => {
        if (d.reminders?.length > 0) {
          const map = new Map<string, number[]>();
          d.reminders.forEach((r: any) => map.set(r.scholarshipId, r.reminderDays));
          setReminders(map);
        }
      })
      .catch(() => {});
  }, []);

  function openReminderPopup(s: any) {
    const deadline = new Date(s.deadline);
    const existing = reminders.get(s.id);
    const existingDates = existing
      ? existing.map(d => { const dt = new Date(deadline); dt.setDate(dt.getDate() - d); return dt; })
      : [];
    setSelectedDates(existingDates);
    setCalMonth(new Date(deadline.getFullYear(), deadline.getMonth(), 1));
    // Do NOT reset reminderTime — keep whatever the user last set
    setReminderPopup(s);
  }

  function toggleDate(date: Date) {
    if (!reminderPopup) return;
    const dl = new Date(reminderPopup.deadline); dl.setHours(0,0,0,0);
    const td = new Date(); td.setHours(0,0,0,0);
    if (date.getTime() >= dl.getTime()) return;
    if (date.getTime() < td.getTime()) return;
    if (selectedDates.length >= 3 && !selectedDates.some(d => d.toDateString() === date.toDateString())) return;
    setSelectedDates(prev => {
      const exists = prev.some(d => d.toDateString() === date.toDateString());
      return exists ? prev.filter(d => d.toDateString() !== date.toDateString()) : [...prev, date];
    });
  }

  async function saveReminder(s: any, dates: Date[]) {
    if (dates.length === 0) return;
    setReminderLoading(s.id);
    const deadlineDay = new Date(s.deadline); deadlineDay.setHours(0,0,0,0);
    const days = dates.map(d => {
      const diff = Math.round((deadlineDay.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    }).filter(d => d > 0);
    const [hours, minutes] = reminderTime.split(":").map(Number);
    console.log(`💾 Saving reminder — time: ${reminderTime} → hour=${hours}, minute=${minutes}`);

    // Save to localStorage immediately (works without MongoDB)
    const localKey = "scholarhub_reminders";
    const existing = JSON.parse(localStorage.getItem(localKey) || "{}");
    existing[s.id] = {
      scholarshipId:    s.id,
      scholarshipTitle: s.name,
      deadline:         s.deadline,
      applyLink:        s.applyLink || "",
      reminderDays:     days,
      reminderHour:     hours,
      reminderMinute:   minutes,
      selectedDates:    dates.map(d => d.toISOString()),
    };
    localStorage.setItem(localKey, JSON.stringify(existing));
    setReminders(prev => new Map(prev).set(s.id, days));

    // Also try to save to MongoDB (optional, won't block if it fails)
    try {
      // Build exact date+time objects for each selected date
      const reminderDatesPayload = dates.map(d => ({
        // Use local date (not UTC) to avoid timezone shift — IST is UTC+5:30
        date:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
        hour:   hours,
        minute: minutes,
      }));

      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarshipId:    s.id,
          scholarshipTitle: s.name,
          deadline:         s.deadline,
          applyLink:        s.applyLink || "",
          reminderDates:    reminderDatesPayload,
          reminderHour:     hours,
          reminderMinute:   minutes,
        }),
      });
    } catch {
      // MongoDB not available — localStorage save is enough
    }

    setReminderLoading(null);
    setReminderPopup(null);
  }

  async function removeReminder(scholarshipId: string) {
    await fetch("/api/reminders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId }),
    });
    setReminders(prev => { const m = new Map(prev); m.delete(scholarshipId); return m; });
  }

  function normalizeCourse(value: string): "School" | "College" | "Any" {
    if (!value) return "Any";
    if (value === "School") return "School";
    if (value === "College") return "College";
    if (value === "Any") return "Any";
    return "College";
  }

  function normalizeLevel(value: string): "Central" | "State" | "Trust" {
    if (value === "Central" || value === "State" || value === "Trust") return value;
    return "Trust";
  }

  // Map store scholarships — re-compute when language changes
  const scholarships = useMemo(() => storeScholarships.map(s => {
    const translated = t(`sch${s.id}`);
    const name = translated && translated !== `sch${s.id}` ? translated : s.title;
    const tDesc = t(`schDesc${s.id}`);
    const tElig = t(`schElig${s.id}`);
    return {
      id:          s.id,
      name,
      category:    s.category,
      level:       s.level    || "Trust",
      course:      s.course   || "Any",
      state:       s.scholarshipState || "Any",
      amount:      s.amount,
      deadline:    s.deadline,
      description: (tDesc && tDesc !== `schDesc${s.id}`) ? tDesc : s.description,
      eligibility: (tElig && tElig !== `schElig${s.id}`) ? tElig : s.eligibility,
      documents:   s.documents,
      applyLink:   s.applyLink,
      youtubeLink: s.youtubeLink,
      provider:    s.provider,
    };
  }), [storeScholarships, t]);

  const recommended = useMemo(() => {
    const hasAnyPreference = Boolean(category || course || state);
    if (!hasAnyPreference) return [];
    return scholarships.filter(s =>
      (!category || s.category === category || s.category === "Any") &&
      (!level    || normalizeLevel(s.level) === level) &&
      (!course   || normalizeCourse(s.course) === course || normalizeCourse(s.course) === "Any") &&
      (!state    || s.state.toLowerCase().includes(state.toLowerCase()) || s.state === "Any")
    );
  }, [category, course, level, state, scholarships]);

  const recommendedNames = useMemo(() => new Set(recommended.map(s => s.name)), [recommended]);

  const filtered = scholarships.filter(s =>
    (!category || s.category === category || s.category === "Any") &&
    (!level    || normalizeLevel(s.level) === level) &&
    (!course   || normalizeCourse(s.course) === course || normalizeCourse(s.course) === "Any") &&
    (!state    || s.state.toLowerCase().includes(state.toLowerCase()) || s.state === "Any") &&
    (!navSearch || s.name.toLowerCase().includes(navSearch.toLowerCase()))
  );

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ── Student Navbar ── */}
      <div className="w-full px-6 py-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg,#1a2744 0%,#1e3a6e 100%)" }}>
        {/* Left — logo */}
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

        {/* Center — search bar */}
        <div className="flex-1 flex justify-center">
          <StudentSmartSearch value={navSearch} onChange={setNavSearch} />
        </div>

        {/* Right — lang + theme + profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <AdminLangSwitcher />
          <ThemeToggle />
          <StudentNotificationBell />
          <StudentProfileDropdown />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">{t("studentDashboardTitle") || "Student Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">{t("studentDashboardSubtitle") || "View scholarships and recommendations"}</p>
        </div>

        {/* 🔝 TOP CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Card 1 — bright blue */}
          <div className="rounded-2xl p-5 shadow-sm text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
            <div className="absolute right-3 top-3 opacity-10"><BookOpen size={56} /></div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100 mb-2">
              {t("totalScholarships") || "Total Scholarships"}
            </p>
            <p className="text-3xl font-bold">{scholarships.length}</p>
            <p className="text-blue-200 text-xs mt-1">Available to apply</p>
          </div>

          {/* Card 2 — orange/amber */}
          <div className="rounded-2xl p-5 shadow-sm text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg,#f97316,#fbbf24)" }}>
            <div className="absolute right-3 top-3 opacity-10 text-6xl">⭐</div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-100 mb-2">
              {t("recommendedScholarships") || "Recommended"}
            </p>
            <p className="text-3xl font-bold">{showResults ? filtered.length : scholarships.length}</p>
            <p className="text-orange-100 text-xs mt-1">{showResults ? "Matching your filters" : "Matched for you"}</p>
          </div>

          {/* Card 3 — teal */}
          <Link href="/student/reminders"
            className="rounded-2xl p-5 shadow-sm text-white relative overflow-hidden hover:opacity-90 transition block"
            style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
            <div className="absolute right-3 top-3 opacity-10"><Bell size={56} /></div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-100 mb-2">
              Active Reminders
            </p>
            <p className="text-3xl font-bold">{reminders.size}</p>
            <p className="text-teal-200 text-xs mt-1">Deadline alerts set</p>
          </Link>

          {/* Card 4 — purple (Abroad) */}
          <Link href="/student/abroad"
            className="rounded-2xl p-5 shadow-sm text-white relative overflow-hidden hover:opacity-90 transition block"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <div className="absolute right-3 top-3 opacity-10"><Globe size={56} /></div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-100 mb-2">
              {t("abroadScholarships") || "Abroad Scholarships"}
            </p>
            <p className="text-3xl font-bold">18</p>
            <p className="text-purple-200 text-xs mt-1">International opportunities</p>
          </Link>
        </div>

        {/* Bookmarks banner */}
        <button
          onClick={() => setShowBookmarks(v => !v)}
          className="w-full flex items-center justify-between mb-6 rounded-2xl px-5 py-4 text-white hover:opacity-90 transition shadow-sm"
          style={{ background: showBookmarks ? "linear-gradient(135deg,#d97706,#b45309)" : "linear-gradient(135deg,#92400e,#78350f)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
              <Bookmark size={18} className="text-white" fill={bookmarks.size > 0 ? "white" : "none"} />
            </div>
            <div>
              <p className="font-bold text-sm">My Bookmarks</p>
              <p className="text-amber-300 text-xs mt-0.5">Scholarships saved for later</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full">
              {bookmarks.size} Saved
            </span>
            <ChevronRight size={16} className={`text-amber-300 transition-transform ${showBookmarks ? "rotate-90" : ""}`} />
          </div>
        </button>

        {/* Bookmarks panel */}
        {showBookmarks && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #fcd34d" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#d97706,#b45309)" }}>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark size={14} fill="white" /> Bookmarked Scholarships
              </h2>
              <span className="text-xs text-amber-200 bg-white/10 px-2.5 py-1 rounded-full">{bookmarks.size} saved</span>
            </div>
            {bookmarks.size === 0 ? (
              <div className="px-5 py-10 text-center bg-amber-50">
                <Bookmark size={32} className="mx-auto text-amber-300 mb-2" />
                <p className="text-sm text-amber-700 font-medium">No bookmarks yet</p>
                <p className="text-xs text-amber-500 mt-1">Click the 🔖 button on any scholarship to save it here</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-sm">
                  <thead style={{ background: "#fef3c7" }}>
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-bold text-amber-700 uppercase tracking-wide">Scholarship</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-amber-700 uppercase tracking-wide">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-amber-700 uppercase tracking-wide">Deadline</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-amber-700 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scholarships.filter(s => bookmarks.has(s.id)).map((s, i) => (
                      <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50/30"}>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{s.category}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{s.level}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {new Date(s.deadline).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => setDetailScholarship(s)}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                              style={{ background: "#0d9488" }}>
                              Details
                            </button>
                            <button onClick={() => toggleBookmark(s.id)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:opacity-90 transition"
                              style={{ background: "#fef3c7", border: "1px solid #fcd34d", color: "#d97706" }}>
                              <Bookmark size={12} fill="#d97706" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 🔍 FILTER */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("casteCategory") || "Caste Category"}
              </label>
              <select
                onChange={(e) => setCategory(e.target.value)}
                value={category}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">{t("allCategories") || "All Categories"}</option>
                <option>SC</option>
                <option>ST</option>
                <option>OBC</option>
                <option>General</option>
                <option>Minority</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">
                {t("scholarshipType") || "Scholarship Type"}
              </label>
              <select
                onChange={(e) => setLevel(e.target.value as any)}
                value={level}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">{t("allTypes") || "All Types"}</option>
                <option value="Central">{t("typeCentral") || "Central"}</option>
                <option value="State">{t("typeState") || "State"}</option>
                <option value="Trust">{t("typeTrust") || "Trust"}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">{t("course") || "Course"}</label>
              <select
                onChange={(e) => setCourse(e.target.value)}
                value={course}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">{t("allCourses") || "All Courses"}</option>
                <option value="School">{t("courseSchool") || "School"}</option>
                <option value="College">{t("courseCollege") || "College"}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">{t("state") || "State"}</label>
              <input
                placeholder={t("statePlaceholder") || "Type state..."}
                onChange={(e) => setState(e.target.value)}
                value={state}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Apply + Clear buttons */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400 font-medium">
              {filtered.length} {t("showing") || "show"}
            </span>
            <div className="flex gap-2">
              {(category || course || level || state) && (
                <button
                  onClick={() => { setCategory(""); setCourse(""); setLevel(""); setState(""); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
                  style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
                  Clear All ✕
                </button>
              )}
              <button
                onClick={() => setShowResults(true)}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
                style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                {t("applyNow") ? t("showing") : "Apply Filter"}
              </button>
            </div>
          </div>
        </div>

        {/* 📊 TABLE — only after Apply */}
        {!showResults ? null : (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
          {/* Dark navy header bar */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: "#1a2744" }}>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              🏆 {t("scholarships") || "Scholarships"}
            </h2>
            <span className="text-xs font-semibold text-blue-200 bg-white/10 px-3 py-1 rounded-full">
              {filtered.length} {t("showing") || "show"}
            </span>
          </div>

          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{t("scholarshipName") || "Scholarship"}</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{t("scholarshipType") || "Type"}</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{t("course") || "Course"}</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{t("state") || "State"}</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{t("actions") || "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const isRec = recommendedNames.has(s.name);
                  const lv = normalizeLevel(s.level);
                  const levelPill =
                    lv === "Central"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : lv === "State"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-pink-50 text-pink-700 border-pink-200";

                  return (
                    <tr
                      key={i}
                      className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} ${isRec ? "border-l-4 border-emerald-500" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{s.name}</span>
                          {isRec && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                              ✅ {t("recommended") || "Recommended"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("eligibleFor") || "Eligible for"}:{" "}
                          <span className="font-medium">{s.category}</span>
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${levelPill}`}>
                          {lv === "Central"
                            ? (t("typeCentral") || "Central")
                            : lv === "State"
                              ? (t("typeState") || "State")
                              : (t("typeTrust") || "Trust")}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                          {normalizeCourse(s.course) === "School"
                            ? (t("courseSchool") || "School")
                            : normalizeCourse(s.course) === "College"
                              ? (t("courseCollege") || "College")
                              : (t("any") || "Any")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{s.state}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setDetailScholarship(s)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition" style={{ background: "#0d9488" }}>
                            {t("viewDetails") || "Details"}
                          </button>
                          <button
                            onClick={() => {
                              if (s.applyLink) {
                                window.open(s.applyLink, "_blank", "noopener,noreferrer");
                              }
                            }}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                            style={{ background: "#16a34a" }}>
                            {t("applyNow") || "Apply"} ↗
                          </button>
                          <button
                            onClick={() => openReminderPopup(s)}
                            disabled={reminderLoading === s.id}
                            title={reminders.has(s.id) ? `Reminder set: ${reminders.get(s.id)?.join(", ")} days before` : "Set deadline reminder"}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1"
                            style={{ background: reminders.has(s.id) ? "#f97316" : "#1e6fff" }}>
                            {reminderLoading === s.id
                              ? "..."
                              : <><Bell size={12} fill={reminders.has(s.id) ? "white" : "none"} />
                                {reminders.has(s.id) ? ` ${reminders.get(s.id)?.join(",")}d` : ""}</>}
                          </button>
                          <button
                            onClick={() => toggleBookmark(s.id)}
                            title={bookmarks.has(s.id) ? "Remove bookmark" : "Bookmark this scholarship"}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold hover:opacity-90 transition flex items-center gap-1"
                            style={{
                              background: bookmarks.has(s.id) ? "#fef3c7" : "#f8fafc",
                              border: `1px solid ${bookmarks.has(s.id) ? "#fcd34d" : "#e2e8f0"}`,
                              color: bookmarks.has(s.id) ? "#d97706" : "#94a3b8",
                            }}>
                            <Bookmark size={12} fill={bookmarks.has(s.id) ? "#d97706" : "none"} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      {t("noScholarships") || "No scholarships found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}

      </div>

      {/* ── Reminder Calendar Popup ── */}
      {reminderPopup && (() => {
        const deadline   = new Date(reminderPopup.deadline);
        deadline.setHours(23, 59, 59, 999); // normalize to end of deadline day
        const today      = new Date(); today.setHours(0, 0, 0, 0);
        const year       = calMonth.getFullYear();
        const month      = calMonth.getMonth();
        const firstDay   = new Date(year, month, 1).getDay();
        const daysInMonth= new Date(year, month + 1, 0).getDate();
        const DAYS       = ["Su","Mo","Tu","We","Th","Fr","Sa"];
        const MONTHS     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => setReminderPopup(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="px-6 py-4 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <Bell size={15} className="text-blue-300" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Set Deadline Reminder</p>
                    <p className="text-blue-300 text-xs mt-0.5 line-clamp-1">{reminderPopup.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Deadline pill in header */}
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.3)" }}>
                    <span className="text-xs">🎯</span>
                    <span className="text-red-300 text-xs font-bold">
                      {deadline.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                    </span>
                  </div>
                  <button onClick={() => setReminderPopup(null)} className="text-white/50 hover:text-white transition"><X size={18} /></button>
                </div>
              </div>

              {/* ── Horizontal layout ── */}
              <div className="flex flex-col sm:flex-row">

                {/* LEFT — Calendar */}
                <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-gray-100">
                  <p className="text-xs text-gray-400 text-center mb-3 font-medium">
                    Click dates to select reminders <span className="text-blue-500 font-bold">(up to 3)</span>
                  </p>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    {/* Month nav */}
                    <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "#1a2744" }}>
                      <button onClick={() => setCalMonth(new Date(year, month - 1, 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition font-bold text-base">‹</button>
                      <p className="text-white font-bold text-sm">{MONTHS[month]} {year}</p>
                      <button onClick={() => setCalMonth(new Date(year, month + 1, 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition font-bold text-base">›</button>
                    </div>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                      {DAYS.map(d => (
                        <div key={d} className="text-center py-1.5 text-xs font-bold text-gray-400">{d}</div>
                      ))}
                    </div>
                    {/* Date grid */}
                    <div className="grid grid-cols-7 p-2 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const date       = new Date(year, month, i + 1);
                        const dl         = new Date(reminderPopup.deadline); dl.setHours(0,0,0,0);
                        const td         = new Date(); td.setHours(0,0,0,0);
                        const isDeadline = date.getTime() === dl.getTime();
                        const isPast     = date.getTime() < td.getTime();
                        const isAfterDL  = date.getTime() > dl.getTime();
                        const isSelected = selectedDates.some(d => d.toDateString() === date.toDateString());
                        const isToday    = date.toDateString() === td.toDateString();
                        const disabled   = isPast || isAfterDL || isDeadline;
                        return (
                          <button key={i} onClick={() => !disabled && toggleDate(date)}
                            disabled={disabled}
                            className={`
                              aspect-square rounded-lg text-xs font-semibold transition-all
                              ${isDeadline ? "text-white font-bold" : ""}
                              ${isSelected ? "text-white scale-105 shadow-sm" : ""}
                              ${isToday && !isSelected && !isDeadline ? "ring-2 ring-blue-400 text-blue-600 bg-blue-50 font-bold" : ""}
                              ${disabled && !isDeadline ? "text-gray-200 cursor-not-allowed" : ""}
                              ${!disabled && !isSelected && !isToday ? "hover:bg-blue-50 text-gray-700" : ""}
                            `}
                            style={{
                              background: isDeadline ? "linear-gradient(135deg,#dc2626,#b91c1c)"
                                : isSelected ? "linear-gradient(135deg,#1e6fff,#2563eb)"
                                : undefined,
                            }}>
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 px-3 py-2 bg-gray-50 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#1e6fff" }} /> Selected
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full inline-block bg-red-500" /> Deadline
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full inline-block border-2 border-blue-400" /> Today
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT — Time + Summary + Actions */}
                <div className="w-full sm:w-56 p-4 flex flex-col gap-3">

                  {/* Time picker */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: "#f8fafc" }}>
                      <span className="text-sm">⏰</span>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Reminder Time</p>
                    </div>
                    <div className="p-3 space-y-2">
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={e => setReminderTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-center"
                      />
                      <div className="grid grid-cols-2 gap-1">
                        {[
                          { label: "Morning", time: "08:00", emoji: "🌅" },
                          { label: "Noon",    time: "12:00", emoji: "☀️" },
                          { label: "Evening", time: "18:00", emoji: "🌆" },
                          { label: "Night",   time: "21:00", emoji: "🌙" },
                        ].map(p => (
                          <button key={p.time} onClick={() => setReminderTime(p.time)}
                            className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              reminderTime === p.time ? "text-white" : "text-gray-500 bg-gray-100 hover:bg-gray-200"
                            }`}
                            style={reminderTime === p.time ? { background: "linear-gradient(135deg,#1e6fff,#2563eb)" } : {}}>
                            {p.emoji} {p.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 text-center pt-1">
                        Send at <b className="text-gray-600">{(() => {
                          const [h, m] = reminderTime.split(":").map(Number);
                          return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
                        })()}</b>
                      </p>
                    </div>
                  </div>

                  {/* Selected dates summary */}
                  <div className="flex-1">
                    {selectedDates.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 text-center">
                        <p className="text-2xl mb-1">📅</p>
                        <p className="text-xs text-gray-400 font-medium">Select dates from the calendar</p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-xs font-bold text-blue-700 mb-2">📧 Will send on:</p>
                        <div className="space-y-1.5">
                          {[...selectedDates].sort((a,b) => a.getTime()-b.getTime()).map((d, i) => {
                            const daysLeft = Math.round((deadline.getTime() - d.getTime()) / (1000*60*60*24));
                            const [h, m]   = reminderTime.split(":").map(Number);
                            const timeStr  = `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
                            return (
                              <div key={i} className="flex items-center justify-between bg-white border border-blue-200 rounded-lg px-2.5 py-1.5">
                                <div>
                                  <p className="text-xs font-bold text-blue-700">
                                    {d.toLocaleDateString("en-IN", { day:"numeric", month:"short" })}
                                  </p>
                                  <p className="text-xs text-blue-400">{timeStr} · {daysLeft}d before</p>
                                </div>
                                <button onClick={() => setSelectedDates(prev => prev.filter(x => x.toDateString() !== d.toDateString()))}
                                  className="text-gray-300 hover:text-red-500 transition font-bold text-base leading-none">×</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => saveReminder(reminderPopup, selectedDates)}
                      disabled={selectedDates.length === 0 || reminderLoading === reminderPopup.id}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition disabled:opacity-40"
                      style={{ background: selectedDates.length === 0 ? "#94a3b8" : "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                      {reminderLoading === reminderPopup.id ? "Saving..." : selectedDates.length > 0 ? `💾 Save (${selectedDates.length}) Reminder` : "Select a date first"}
                    </button>
                    <div className="flex gap-2">
                      {reminders.has(reminderPopup.id) && (
                        <button onClick={() => { removeReminder(reminderPopup.id); setReminderPopup(null); }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition"
                          style={{ background: "#dc2626" }}>
                          🗑 Remove
                        </button>
                      )}
                      <button onClick={() => setReminderPopup(null)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── View Details Modal ── */}
      {detailScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDetailScholarship(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-5 flex items-start justify-between flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <div className="flex-1 pr-4">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide mb-1">Scholarship Details</p>
                <h2 className="text-white font-bold text-lg leading-snug">{detailScholarship.name}</h2>
                {detailScholarship.provider && (
                  <p className="text-blue-300 text-xs mt-1">by {detailScholarship.provider}</p>
                )}
              </div>
              <button onClick={() => setDetailScholarship(null)} className="text-white/60 hover:text-white transition mt-1 flex-shrink-0">
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">

              {/* Quick info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Tag size={15} />,         label: "Category", value: detailScholarship.category,                                      color: "#1a2744" },
                  { icon: <IndianRupee size={15} />, label: "Amount",   value: `₹${detailScholarship.amount}/yr`,                               color: "#16a34a" },
                  { icon: <Calendar size={15} />,    label: "Deadline", value: new Date(detailScholarship.deadline).toLocaleDateString("en-IN"), color: "#f97316" },
                  { icon: <Users size={15} />,       label: "Level",    value: detailScholarship.level,                                          color: "#1e6fff" },
                  { icon: <BookOpen size={15} />,    label: "Course",   value: detailScholarship.course,                                         color: "#0d9488" },
                  { icon: <Tag size={15} />,         label: "State",    value: detailScholarship.state || "Any",                                 color: "#7c3aed" },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: row.color }}>
                      {row.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {detailScholarship.description && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">About</p>
                  <p className="text-sm text-gray-700">{detailScholarship.description}</p>
                </div>
              )}

              {/* Eligibility */}
              {detailScholarship.eligibility && (
                <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Eligibility</p>
                  <p className="text-sm text-gray-700">{detailScholarship.eligibility}</p>
                </div>
              )}

              {/* Documents */}
              {detailScholarship.documents && (
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Documents Required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailScholarship.documents.split(",").map((doc: string, i: number) => (
                      <span key={i} className="text-xs bg-white border border-orange-200 text-orange-800 px-2 py-1 rounded-lg font-medium">
                        {doc.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons — always visible */}
            <div className="px-5 pb-5 pt-3 flex flex-col gap-3 border-t border-gray-100 flex-shrink-0">
              {/* YouTube — full width, most prominent */}
              {detailScholarship.youtubeLink && (
                <a href={detailScholarship.youtubeLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition"
                  style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  ▶ Watch How to Apply on YouTube
                </a>
              )}
              <div className="flex gap-3">
                {detailScholarship.applyLink ? (
                  <a href={detailScholarship.applyLink} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition text-center"
                    style={{ background: "#16a34a" }}>
                    {t("applyNow") || "Apply Now"} ↗
                  </a>
                ) : (
                  <button disabled
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white opacity-50 cursor-not-allowed"
                    style={{ background: "#6b7280" }}>
                    No Official Link
                  </button>
                )}
                <button onClick={() => setDetailScholarship(null)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Appended: this file already ends above — no-op append to trigger save
