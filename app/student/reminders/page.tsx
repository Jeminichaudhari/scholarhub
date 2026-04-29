"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, GraduationCap, ArrowLeft, X, IndianRupee, Calendar, Tag, Users, BookOpen, Trash2 } from "lucide-react";
import { useScholarshipStore } from "@/lib/use-scholarship-store";
import { useLanguage } from "@/lib/language-context";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import StudentProfileDropdown from "@/components/student-profile-dropdown";
import ThemeToggle from "@/components/theme-toggle";
import StudentNotificationBell from "@/components/student-notification-bell";

export default function RemindersPage() {
  const { t } = useLanguage();
  const { scholarships: storeScholarships, isLoaded } = useScholarshipStore();
  const [reminders, setReminders] = useState<Record<string, any>>({});
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem("scholarhub_reminders") || "{}");
      setReminders(local);
    } catch {}
  }, []);

  function removeReminder(id: string) {
    const updated = { ...reminders };
    delete updated[id];
    localStorage.setItem("scholarhub_reminders", JSON.stringify(updated));
    setReminders(updated);
    // Also call API
    fetch("/api/reminders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scholarshipId: id }),
    }).catch(() => {});
  }

  const reminderIds = Object.keys(reminders);

  const scholarshipsWithReminders = storeScholarships
    .filter(s => reminderIds.includes(s.id))
    .map(s => {
      const tr = t(`sch${s.id}`);
      const name = tr && tr !== `sch${s.id}` ? tr : s.title;
      const r = reminders[s.id];
      return { ...s, name, reminderData: r };
    });

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
            <p className="text-blue-300 text-xs mt-0.5">Active Reminders</p>
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
              <Bell size={18} fill="#0d9488" className="text-teal-500" />
              Active Reminders
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{scholarshipsWithReminders.length} reminder{scholarshipsWithReminders.length !== 1 ? "s" : ""} set</p>
          </div>
        </div>

        {/* Empty state */}
        {!isLoaded || scholarshipsWithReminders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50 py-20 text-center">
            <Bell size={40} className="mx-auto text-teal-300 mb-3" />
            <p className="text-base font-bold text-teal-700 mb-1">No reminders set yet</p>
            <p className="text-sm text-teal-500 mb-6">Click the 🔔 bell on any scholarship to set a deadline reminder</p>
            <Link href="/student"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
              Browse Scholarships
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #99f6e4" }}>

            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell size={14} fill="white" /> Scholarships with Reminders
              </h2>
              <span className="text-xs text-teal-200 bg-white/10 px-2.5 py-1 rounded-full">
                {scholarshipsWithReminders.length} active
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-card">
              <table className="w-full text-sm">
                <thead style={{ background: "#f0fdfa", borderBottom: "2px solid #99f6e4" }}>
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-bold text-teal-700 uppercase tracking-wide w-[35%]">Scholarship</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-teal-700 uppercase tracking-wide w-[18%]">Deadline</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-teal-700 uppercase tracking-wide w-[27%]">Reminder Dates</th>
                    <th className="text-right px-5 py-3 text-xs font-bold text-teal-700 uppercase tracking-wide w-[20%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50">
                  {scholarshipsWithReminders.map((s, i) => {
                    const deadlineDate = new Date(s.deadline);
                    const daysLeft  = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const isUrgent  = daysLeft <= 7 && daysLeft > 0;
                    const isExpired = daysLeft <= 0;
                    const rd = s.reminderData;
                    // Get reminder dates from localStorage data
                    const reminderDates: string[] = rd?.selectedDates || [];
                    const reminderHour: number = rd?.reminderHour ?? 9;
                    const reminderMinute: number = rd?.reminderMinute ?? 0;
                    const ampm = reminderHour >= 12 ? "PM" : "AM";
                    const h12  = reminderHour % 12 || 12;
                    const timeStr = `${h12}:${String(reminderMinute).padStart(2,"0")} ${ampm}`;

                    return (
                      <tr key={s.id} className={i % 2 === 0 ? "bg-card" : "bg-teal-50/20"}>

                        {/* Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-10 rounded-full flex-shrink-0"
                              style={{ background: "linear-gradient(180deg,#0d9488,#0f766e)" }} />
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{s.category} · {s.provider}</p>
                            </div>
                          </div>
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

                        {/* Reminder dates */}
                        <td className="px-5 py-4">
                          {reminderDates.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {reminderDates.slice(0, 3).map((d, idx) => {
                                const dt = new Date(d);
                                return (
                                  <span key={idx} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full w-fit">
                                    📅 {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at {timeStr}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setDetail(s)}
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition"
                              style={{ background: "#0d9488" }}>
                              Details
                            </button>
                            <button onClick={() => removeReminder(s.id)}
                              title="Remove reminder"
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
                  { icon: <Tag size={15} />,         label: "Category", value: detail.category,                                      color: "#1a2744" },
                  { icon: <IndianRupee size={15} />, label: "Amount",   value: `₹${detail.amount}/yr`,                               color: "#16a34a" },
                  { icon: <Calendar size={15} />,    label: "Deadline", value: new Date(detail.deadline).toLocaleDateString("en-IN"), color: "#f97316" },
                  { icon: <Users size={15} />,       label: "Level",    value: detail.level || "Trust",                              color: "#1e6fff" },
                  { icon: <BookOpen size={15} />,    label: "Course",   value: detail.course || "Any",                               color: "#0d9488" },
                  { icon: <Tag size={15} />,         label: "State",    value: detail.scholarshipState || "Any",                     color: "#7c3aed" },
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
            </div>
            <div className="px-5 pb-5 pt-3 flex gap-3 border-t border-gray-100 flex-shrink-0">
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
      )}
    </div>
  );
}
