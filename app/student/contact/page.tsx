"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/language-context";
import AdminLangSwitcher from "@/components/admin-lang-switcher";
import StudentProfileDropdown from "@/components/student-profile-dropdown";
import StudentSmartSearch from "@/components/student-smart-search";
import ThemeToggle from "@/components/theme-toggle";
import StudentNotificationBell from "@/components/student-notification-bell";
import {
  GraduationCap, ArrowLeft, MessageCircle,
  Mail, Phone, Send, CheckCircle2
} from "lucide-react";

export default function StudentContactPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();

  const [form, setForm] = useState({
    name:    "",
    email:   "",
    subject: "",
    message: "",
  });
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");

  // Sync session data into form once loaded
  useEffect(() => {
    if (session?.user) {
      setForm(f => ({
        ...f,
        name:  session.user?.name  || "",
        email: session.user?.email || "",
      }));
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject || !form.message) return;
    setSending(true); setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setForm(f => ({ ...f, subject: "", message: "" }));
      } else {
        setError(data.message || "Failed to send. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSending(false);
  }

  const inp = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-background text-foreground transition-colors";

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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("contactUs") || "Contact Us"}</h1>
            <p className="text-sm text-muted-foreground">We're here to help with any scholarship queries</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Contact Info */}
          <div className="space-y-4">
            {[
              { icon: <Mail size={18} />,    label: "Email Us",      value: "scholarhub2026@gmail.com",  color: "#1e6fff", bg: "rgba(30,111,255,0.1)"  },
              { icon: <Phone size={18} />,   label: "Call Us",       value: "+91 84697 34273",            color: "#0d9488", bg: "rgba(13,148,136,0.1)"  },
            ].map(item => (
              <div key={item.label} className="bg-card rounded-2xl p-5 border border-border flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}

            {/* FAQ hint */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm"
              style={{ borderLeft: "3px solid #7c3aed" }}>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Common Issues</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  "Can't find my scholarship",
                  "Login / OTP not received",
                  "Document upload issues",
                  "Reminder not working",
                  "Application status query",
                ].map(q => (
                  <li key={q} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border"
              style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
              <h2 className="text-sm font-bold text-white">Send us a Message</h2>
              <p className="text-blue-300 text-xs mt-0.5">We'll get back to you within 24 hours</p>
            </div>

            <div className="p-6">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Thank you for reaching out. We'll respond within 24 hours.
                  </p>
                  <button onClick={() => setSent(false)}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Your Name
                      </label>
                      <input value={form.name} readOnly
                        className={`${inp} cursor-not-allowed opacity-70 select-none`} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                        Email Address
                      </label>
                      <input type="email" value={form.email} readOnly
                        className={`${inp} cursor-not-allowed opacity-70 select-none`} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Subject *
                    </label>
                    <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Can't find my scholarship, Login issue..."
                      className={inp} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Message *
                    </label>
                    <textarea required rows={5} value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your issue or question in detail..."
                      className={`${inp} resize-y`} />
                    <p className="text-xs text-muted-foreground mt-1">{form.message.length} characters</p>
                  </div>

                  <button type="submit" disabled={sending}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition shadow-sm"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    {sending
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                      : <><Send size={14} />Send Message</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
