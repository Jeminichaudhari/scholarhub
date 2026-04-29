"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, GraduationCap, X, ArrowLeft, IndianRupee, Calendar, Tag, Users, BookOpen, ExternalLink, Trash2 } from "lucide-react";
import { useScholarshipStore } from "@/lib/use-scholarship-store";
import { useLanguage } from "@/lib/language-context";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import StudentProfileDropdown from "@/components/student-profile-dropdown";
import ThemeToggle from "@/components/theme-toggle";
import StudentNotificationBell from "@/components/student-notification-bell";

export default function SavedScholarshipsPage() {
  const { t } = useLanguage();
  const { scholarships: storeScholarships, isLoaded } = useScholarshipStore();
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("scholarhub_bookmarks") || "[]");
      setBookmarks(new Set(saved));
    } catch {}
  }, []);

  function removeBookmark(id: string) {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem("scholarhub_bookmarks", JSON.stringify([...next]));
      return next;
    });
  }

  const saved = storeScholarships.filter(s => bookmarks.has(s.id)).map(s => {
    const tr = t(`sch${s.id}`);
    return { ...s, name: (tr && tr !== `sch${s.id}`) ? tr : s.title };
  });

  const levelColor: Record<string, string> = {
    Central: "bg-indigo-50 text-indigo-700 border-indigo-200",
    State:   "bg-amber-50 text-amber-700 border-amber-200",
    Trust:   "bg-pink-50 text-pink-700 border-pink-200",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="w-full px-6 py-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg,#1a2744 0%,#1e3a6e 100%)" }}>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-none">ScholarHub</p>
            <p className="text-blue-300 text-xs mt-0.5">Saved Scholarships</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/student"
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition"
            style={{ background: "rgba(255,255,255,0.12)" }}>
            <ArrowLeft size={16} className="text-white" />
          </Link>
          <AdminLangSwitcher />
          <ThemeToggle />
          <StudentNotificationBell />
          <StudentProfileDropdown />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bookmark size={18} fill="#d97706" className="text-amber-500" />
              Saved Scholarships
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{saved.length} saved</p>
          </div>
        </div>

        {/* Empty state */}
        {!isLoaded || saved.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50 py-20 text-center">
            <Bookmark size={40} className="mx-auto text-amber-300 mb-3" />
            <p className="text-base font-bold text-amber-700 mb-1">No saved scholarships yet</p>
            <p className="text-sm text-amber-500 mb-6">Click the 🔖 button on any scholarship to save it here</p>
            <Link href="/student"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#d97706,#b45309)" }}>
              Browse Scholarships
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #e2e8f0" }}>

            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark size={14} fill="white" /> My Saved Scholarships
              </h2>
              <span className="text-xs text-blue-200 bg-white/10 px-2.5 py-1 rounded-full">{saved.length} saved</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-[40%]">Scholarship</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-[15%]">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-[15%]">Deadline</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-[12%]">Type</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-[18%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {saved.map((s, i) => {
                    const lv = (s.level || "Trust") as string;
                    const pill = levelColor[lv] || levelColor.Trust;
                    const deadlineDate = new Date(s.deadline);
                    const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isUrgent  = daysLeft <= 7 && daysLeft > 0;
                    const isExpired = daysLeft <= 0;

                    return (
                      <tr key={s.id}
                        className={`hover:bg-amber-50/30 transition-colors ${i % 2 === 1 ? "bg-muted/20" : "bg-card"}`}>

                        {/* Scholarship name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-10 rounded-full flex-shrink-0"
                              style={{ background: "linear-gradient(180deg,#d97706,#b45309)" }} />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm leading-snug">{s.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{s.category} · {s.provider}</p>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-green-700">₹{s.amount}</span>
                          <p className="text-xs text-gray-400 mt-0.5">per year</p>
                        </td>

                        {/* Deadline */}
                        <td className="px-5 py-4">
                          <p className={`text-sm font-semibold ${isExpired ? "text-red-500" : isUrgent ? "text-orange-500" : "text-gray-700"}`}>
                            {deadlineDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className={`text-xs mt-0.5 font-medium ${isExpired ? "text-red-400" : isUrgent ? "text-orange-400" : "text-gray-400"}`}>
                            {isExpired ? "⚠ Expired" : isUrgent ? `🔥 ${daysLeft}d left!` : `${daysLeft}d left`}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${pill}`}>
                            {lv}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setDetail(s)}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                              style={{ background: "#0d9488" }}>
                              Details
                            </button>
                            {s.applyLink && (
                              <a href={s.applyLink} target="_blank" rel="noopener noreferrer"
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                                style={{ background: "#16a34a" }}>
                                Apply ↗
                              </a>
                            )}
                            <button onClick={() => removeBookmark(s.id)}
                              title="Remove bookmark"
                              className="rounded-lg p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-start justify-between flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <div className="flex-1 pr-4">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide mb-1">Scholarship Details</p>
                <h2 className="text-white font-bold text-lg leading-snug">{detail.name}</h2>
                {detail.provider && <p className="text-blue-300 text-xs mt-1">by {detail.provider}</p>}
              </div>
              <button onClick={() => setDetail(null)} className="text-white/60 hover:text-white mt-1 flex-shrink-0"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Tag size={15} />,         label: "Category", value: detail.category,                                            color: "#1a2744" },
                  { icon: <IndianRupee size={15} />, label: "Amount",   value: `₹${detail.amount}/yr`,                                     color: "#16a34a" },
                  { icon: <Calendar size={15} />,    label: "Deadline", value: new Date(detail.deadline).toLocaleDateString("en-IN"),       color: "#f97316" },
                  { icon: <Users size={15} />,       label: "Level",    value: detail.level || "Trust",                                    color: "#1e6fff" },
                  { icon: <BookOpen size={15} />,    label: "Course",   value: detail.course || "Any",                                     color: "#0d9488" },
                  { icon: <Tag size={15} />,         label: "State",    value: detail.scholarshipState || "Any",                           color: "#7c3aed" },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: row.color }}>{row.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{row.label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {detail.description && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">About</p>
                  <p className="text-sm text-gray-700">{detail.description}</p>
                </div>
              )}
              {detail.eligibility && (
                <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Eligibility</p>
                  <p className="text-sm text-gray-700">{detail.eligibility}</p>
                </div>
              )}
              {detail.documents && (
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">Documents Required</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.documents.split(",").map((doc: string, i: number) => (
                      <span key={i} className="text-xs bg-white border border-orange-200 text-orange-800 px-2 py-1 rounded-lg font-medium">{doc.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 pt-3 flex flex-col gap-3 border-t border-gray-100 flex-shrink-0">
              {detail.youtubeLink && (
                <a href={detail.youtubeLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition"
                  style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  ▶ Watch How to Apply on YouTube
                </a>
              )}
              <div className="flex gap-3">
                {detail.applyLink ? (
                  <a href={detail.applyLink} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition text-center"
                    style={{ background: "#16a34a" }}>
                    Apply Now ↗
                  </a>
                ) : (
                  <button disabled className="flex-1 py-3 rounded-xl text-sm font-bold text-white opacity-50 cursor-not-allowed" style={{ background: "#6b7280" }}>No Official Link</button>
                )}
                <button onClick={() => setDetail(null)}
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
