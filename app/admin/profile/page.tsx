"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard, Users, Settings, BarChart3,
  Mail, User, Shield, Clock, Monitor,
  KeyRound, Bell, LogOut, Edit3, Save,
  ChevronRight, CheckCircle2, BookOpen
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import ThemeToggle from "@/components/theme-toggle";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard",       href: "/admin" },
  { icon: Users,           label: "User Management", href: "/admin/users" },
  { icon: BookOpen,        label: "Scholarships",     href: "/admin" },
  { icon: BarChart3,       label: "Reports",          href: "/admin/reports" },
  { icon: Settings,        label: "Settings",         href: "/admin/settings" },
];

export default function AdminProfilePage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [twoFA, setTwoFA]     = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({
    email: session?.user?.email || "admin@scholarhub.com",
  });

  const admin = {
    name:      session?.user?.name  || "Admin User",
    email:     form.email,
    username:  "admin_scholarhub",
    lastLogin: "Today at 10:32 AM",
  };

  return (
    <div className="min-h-screen flex" className="bg-background">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen shadow-lg flex-shrink-0"
        style={{ background: "#1a2744" }}>
        <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">ScholarHub</p>
              <p className="text-xs" style={{ color: "#7b9cc4" }}>Admin Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ icon: Icon, label, href }) => {
            const active = label === "Dashboard";
            return (
              <Link key={label} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: active ? "rgba(30,111,255,0.18)" : "transparent", color: active ? "#60a5fa" : "#94a3b8" }}>
                <Icon size={17} /><span>{label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-red-500/10 text-red-400 transition">
            <LogOut size={17} /> {t("logout")}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-foreground">{t("adminProfile")}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{t("manageAccount")}</p>
          </div>
          <div className="flex items-center gap-3">
            <AdminLangSwitcher />
            <ThemeToggle />
            <button className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition relative">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
              {admin.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-5 max-w-4xl w-full mx-auto">

          {/* Hero card */}
          <div className="bg-card rounded-2xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-gray-100 shadow-md flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#1a2744,#1e6fff)" }}>
                  {admin.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{admin.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{admin.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-xs text-emerald-600 font-medium">{t("activeStatus")} · Online now</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(!editing)}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition shadow-sm"
                  style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                  <Edit3 size={14} /> {editing ? t("cancel") : t("editProfile")}
                </button>
                {editing && (
                  <button onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition shadow-sm"
                    style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                    <Save size={14} /> {t("save")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">

            {/* Account Details */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(30,111,255,0.1)" }}>
                  <Shield size={14} style={{ color: "#1e6fff" }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{t("accountDetails")}</h3>
              </div>
              <div className="p-5 space-y-3">
                {editing ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t("emailAddress2")}</label>
                    <input type="email" value={form.email}
                      onChange={e => setForm({ email: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-background text-foreground" />
                  </div>
                ) : (
                  <InfoRow icon={<Mail size={15} />} label={t("emailAddress2")} value={admin.email} color="#1e6fff" />
                )}
                <InfoRow icon={<User size={15} />}  label={t("username")}   value={admin.username}  color="#1a2744" />
                <InfoRow icon={<Clock size={15} />} label={t("lastLogin")}  value={admin.lastLogin} color="#0d9488" />
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(16,185,129,0.12)" }}>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium">{t("accountStatus")}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{t("activeStatus")}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                    <CheckCircle2 size={10} /> {t("activeStatus")}
                  </span>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(30,111,255,0.1)" }}>
                  <KeyRound size={14} style={{ color: "#1e6fff" }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{t("security")}</h3>
              </div>
              <div className="p-5 space-y-4">
                {/* Change password */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-blue-50/20 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(30,111,255,0.1)" }}>
                      <KeyRound size={15} style={{ color: "#1e6fff" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t("changePassword")}</p>
                      <p className="text-xs text-gray-400">{t("lastChanged")}</p>
                    </div>
                  </div>
                  <button className="text-xs font-bold px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition"
                    style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
                    {t("save")}
                  </button>
                </div>

                {/* 2FA */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: twoFA ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.1)" }}>
                      <Shield size={15} className={twoFA ? "text-emerald-600" : "text-gray-400"} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t("twoFactorAuth")}</p>
                      <p className="text-xs text-gray-400">{twoFA ? t("twoFactorOn") : t("twoFactorOff")}</p>
                    </div>
                  </div>
                  <button onClick={() => setTwoFA(!twoFA)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${twoFA ? "bg-emerald-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${twoFA ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>

                {/* Active sessions */}
                <div className="p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
                      <Monitor size={15} className="text-orange-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{t("activeSessions")}</p>
                  </div>
                  {[
                    { device: "Chrome · Windows 11", location: "Ahmedabad, IN", time: "Now",    current: true },
                    { device: "Safari · iPhone 14",  location: "Ahmedabad, IN", time: "2h ago", current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-t border-gray-100 first:border-0">
                      <div>
                        <p className="text-xs font-semibold text-gray-700">{s.device}</p>
                        <p className="text-xs text-gray-400">{s.location} · {s.time}</p>
                      </div>
                      {s.current
                        ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{t("currentSession")}</span>
                        : <button className="text-xs text-red-500 font-semibold hover:underline">{t("revokeSession")}</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:col-span-2">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(30,111,255,0.1)" }}>
                  <Settings size={14} style={{ color: "#1e6fff" }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{t("quickActions")}</h3>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-3">
                <ActionBtn icon={<Edit3 size={15} />}           label={t("editProfile")}   desc={t("updateEmail")}          bg="linear-gradient(135deg,#1e6fff,#2563eb)"   onClick={() => setEditing(true)} />
                <ActionBtn icon={<Save size={15} />}            label={t("saveChanges")}   desc={t("saveAllUpdates")}       bg="linear-gradient(135deg,#0d9488,#0f766e)"   onClick={() => setEditing(false)} />
                <ActionBtn icon={<LayoutDashboard size={15} />} label={t("goToDashboard")} desc={t("backToAdminOverview")}  bg="#1a2744"                                    href="/admin" />
                <ActionBtn icon={<LogOut size={15} />}          label={t("logout")}        desc={t("signOut")}              bg="linear-gradient(135deg,#ef4444,#dc2626)"   onClick={() => signOut({ callbackUrl: "/login" })} />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-blue-50/40 transition">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white" style={{ background: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, desc, bg, onClick, href }: {
  icon: React.ReactNode; label: string; desc: string; bg: string;
  onClick?: () => void; href?: string;
}) {
  const cls = "flex items-center gap-4 p-3.5 rounded-xl border border-gray-100 hover:shadow-md transition-all group cursor-pointer w-full text-left";
  const inner = (
    <>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white group-hover:scale-105 transition-transform" style={{ background: bg }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-gray-500 transition" />
    </>
  );
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  return <button onClick={onClick} className={cls}>{inner}</button>;
}
