"use client";

import { useScholarshipStore } from "@/lib/use-scholarship-store";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/language-context";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import StudentProfileDropdown from "@/components/student-profile-dropdown";
import StudentSmartSearch from "@/components/student-smart-search";
import ThemeToggle from "@/components/theme-toggle";
import StudentNotificationBell from "@/components/student-notification-bell";
import {
  GraduationCap, History,
  CheckCircle2, XCircle, Clock, ChevronRight,
  BookOpen, Calendar, IndianRupee, ArrowLeft
} from "lucide-react";

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    icon: <CheckCircle2 size={16} />,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    line: "bg-emerald-200",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle size={16} />,
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-500",
    line: "bg-red-200",
  },
  pending: {
    label: "Pending Review",
    icon: <Clock size={16} />,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    line: "bg-amber-200",
  },
  applied: {
    label: "Applied",
    icon: <CheckCircle2 size={16} />,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    line: "bg-blue-200",
  },
};

export default function HistoryPage() {
  const { applications, isLoaded } = useScholarshipStore();
  const { data: session } = useSession();
  const { t } = useLanguage();

  const studentName  = session?.user?.name  || "Student";
  const studentEmail = session?.user?.email || "";

  // Filter only this student's applications
  const myApps = applications.filter(a =>
    !studentEmail || a.studentEmail === studentEmail
  );

  const counts = {
    total:    myApps.length,
    approved: myApps.filter(a => a.status === "approved").length,
    pending:  myApps.filter(a => a.status === "pending").length,
    rejected: myApps.filter(a => a.status === "rejected").length,
  };

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );

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

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/student"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft size={15} /> Dashboard
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-sm font-semibold text-gray-700">Application History</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
            <History size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Application History</h1>
            <p className="text-sm text-gray-500">Track all your scholarship applications</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Applied",  value: counts.total,    bg: "#1a2744",                                        sub: "text-blue-200"   },
            { label: "Approved",       value: counts.approved, bg: "linear-gradient(135deg,#0d9488,#0f766e)",        sub: "text-teal-100"   },
            { label: "Pending",        value: counts.pending,  bg: "linear-gradient(135deg,#f97316,#fbbf24)",        sub: "text-orange-100" },
            { label: "Rejected",       value: counts.rejected, bg: "linear-gradient(135deg,#dc2626,#b91c1c)",        sub: "text-red-100"    },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-white shadow-sm" style={{ background: c.bg }}>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${c.sub}`}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {myApps.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#f1f5f9" }}>
              <BookOpen size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No applications yet</p>
            <p className="text-gray-400 text-sm mt-1">Go to the dashboard and apply for scholarships</p>
            <Link href="/student"
              className="inline-flex items-center gap-2 mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
              Browse Scholarships
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <History size={15} className="text-blue-300" />
              <h2 className="text-sm font-bold text-white">All Applications</h2>
              <span className="text-xs text-blue-300 bg-white/10 px-2 py-0.5 rounded-full ml-1">{myApps.length}</span>
            </div>

            {/* Timeline list */}
            <div className="p-5 space-y-0">
              {[...myApps].reverse().map((app, i) => {
                const cfg = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                const isLast = i === myApps.length - 1;

                return (
                  <div key={app.id} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} />
                      {!isLast && <div className={`w-0.5 flex-1 my-1 ${cfg.line}`} />}
                    </div>

                    {/* Card */}
                    <div className={`flex-1 mb-4 rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm">{app.scholarshipTitle}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar size={11} /> Applied: {new Date(app.appliedDate).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </div>
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>

                      {/* Progress steps */}
                      <div className="flex items-center gap-1 mt-3">
                        {[
                          { key: "applied",  label: "Applied"  },
                          { key: "pending",  label: "Review"   },
                          { key: "approved", label: "Decision" },
                        ].map((step, si) => {
                          const order = ["applied", "pending", "approved", "rejected"];
                          const currentIdx = order.indexOf(app.status);
                          const stepIdx    = order.indexOf(step.key);
                          const done = app.status === "rejected"
                            ? stepIdx <= 1
                            : stepIdx <= currentIdx;
                          return (
                            <div key={step.key} className="flex items-center gap-1 flex-1">
                              <div className={`flex-1 h-1.5 rounded-full transition-all ${done ? "bg-current opacity-60" : "bg-gray-200"} ${cfg.text}`} />
                              {si === 2 && (
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? cfg.dot : "bg-gray-200"}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">Applied</span>
                        <span className="text-xs text-gray-400">Under Review</span>
                        <span className="text-xs text-gray-400">
                          {app.status === "rejected" ? "Rejected" : app.status === "approved" ? "Approved ✓" : "Decision"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
