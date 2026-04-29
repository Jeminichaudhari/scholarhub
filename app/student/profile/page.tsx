'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLanguage } from "@/lib/language-context"
import AdminLangSwitcher from '@/components/admin-lang-switcher'
import StudentProfileDropdown from '@/components/student-profile-dropdown'
import StudentSmartSearch from '@/components/student-smart-search'
import ThemeToggle from '@/components/theme-toggle'
import StudentNotificationBell from '@/components/student-notification-bell'
import {
  GraduationCap, Mail, Phone, MapPin, User, Calendar,
  BookOpen, ArrowLeft, Edit3, Save, X, CheckCircle2, Loader2
} from 'lucide-react'

const brand = "linear-gradient(135deg,#1a2744,#1e6fff)"
const brandColor = "#1e6fff"

const GENDERS   = ["Male", "Female", "Other"]
const CASTES    = ["General", "OBC", "SC", "ST", "EWS", "Minority"]
const YEARS     = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "PhD"]

export default function StudentProfile() {
  const { t } = useLanguage()
  const { data: session } = useSession()

  const [profile, setProfile]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [form, setForm]         = useState<any>({})

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => {
        const u = d.user || {}
        setProfile(u)
        setForm({
          name:        u.name        || session?.user?.name  || "",
          email:       u.email       || session?.user?.email || "",
          phone:       u.phone       || "",
          address:     u.address     || "",
          dateOfBirth: u.dateOfBirth || "",
          gender:      u.gender      || "",
          category:    u.category    || "",
          income:      u.income      || "",
          // academic (stored in localStorage since not in User model)
          tenth:       localStorage.getItem("sh_tenth")      || "",
          twelfth:     localStorage.getItem("sh_twelfth")    || "",
          course:      localStorage.getItem("sh_course")     || "",
          university:  localStorage.getItem("sh_university") || "",
          year:        localStorage.getItem("sh_year")       || "",
          enrollment:  localStorage.getItem("sh_enrollment") || "",
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [session])

  async function handleSave() {
    setSaving(true)
    // Save academic fields to localStorage
    const academic = ["tenth","twelfth","course","university","year","enrollment"]
    academic.forEach(k => localStorage.setItem(`sh_${k}`, form[k] || ""))

    // Save personal fields to API
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:        form.name,
        phone:       form.phone,
        address:     form.address,
        dateOfBirth: form.dateOfBirth,
        gender:      form.gender,
        category:    form.category,
        income:      form.income ? Number(form.income) : undefined,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setProfile({ ...profile, ...form })
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function handleCancel() {
    setForm({
      name:        profile?.name        || "",
      email:       profile?.email       || "",
      phone:       profile?.phone       || "",
      address:     profile?.address     || "",
      dateOfBirth: profile?.dateOfBirth || "",
      gender:      profile?.gender      || "",
      category:    profile?.category    || "",
      income:      profile?.income      || "",
      tenth:       localStorage.getItem("sh_tenth")      || "",
      twelfth:     localStorage.getItem("sh_twelfth")    || "",
      course:      localStorage.getItem("sh_course")     || "",
      university:  localStorage.getItem("sh_university") || "",
      year:        localStorage.getItem("sh_year")       || "",
      enrollment:  localStorage.getItem("sh_enrollment") || "",
    })
    setEditing(false)
  }

  const inp = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-background text-foreground transition-colors"
  const lbl = "block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5"

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

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("studentProfileTitle") || "Student Profile"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your personal and academic information</p>
          </div>
          {!loading && (
            editing ? (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition shadow-sm"
                  style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save Changes</>}
                </button>
                <button onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition">
                  <X size={14} /> Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition shadow-sm"
                style={{ background: brand }}>
                <Edit3 size={14} /> Edit Profile
              </button>
            )
          )}
        </div>

        {/* Success toast */}
        {saved && (
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
            <CheckCircle2 size={16} /> Profile saved successfully!
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Profile hero card */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex items-center gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ background: brand }}>
                {(form.name || "S").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground">{form.name || "—"}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{form.email}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {form.course && <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: brandColor }}>{form.course}</span>}
                  {form.year   && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{form.year}</span>}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2"
                style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
                <User size={15} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">{t("personalInformation") || "Personal Information"}</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <div>
                      <label className={lbl}>Full Name</label>
                      <input className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className={lbl}>Email Address</label>
                      <input className={`${inp} opacity-60 cursor-not-allowed`} value={form.email} readOnly />
                    </div>
                    <div>
                      <label className={lbl}>Phone Number</label>
                      <input className={inp} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                    </div>
                    <div>
                      <label className={lbl}>Date of Birth</label>
                      <input type="date" className={inp} value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                    </div>
                    <div>
                      <label className={lbl}>Gender</label>
                      <select className={inp} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                        <option value="">Select gender</option>
                        {GENDERS.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Caste Category</label>
                      <select className={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                        <option value="">Select category</option>
                        {CASTES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Annual Income (₹)</label>
                      <input type="number" className={inp} value={form.income} onChange={e => setForm({ ...form, income: e.target.value })} placeholder="e.g. 350000" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={lbl}>Address</label>
                      <input className={inp} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, State" />
                    </div>
                  </>
                ) : (
                  <>
                    <InfoRow icon={<Mail size={15} />}     label={t("emailAddress") || "Email"}        value={form.email}       />
                    <InfoRow icon={<Phone size={15} />}    label={t("phoneNumber") || "Phone"}         value={form.phone}       />
                    <InfoRow icon={<MapPin size={15} />}   label={t("address") || "Address"}           value={form.address}     />
                    <InfoRow icon={<Calendar size={15} />} label={t("dateOfBirth") || "Date of Birth"} value={form.dateOfBirth} />
                    <InfoRow icon={<User size={15} />}     label={t("gender") || "Gender"}             value={form.gender}      />
                    <InfoRow icon={<BookOpen size={15} />} label={t("casteCategory") || "Category"}    value={form.category}    />
                    <InfoRow icon={<BookOpen size={15} />} label={t("annualIncome") || "Annual Income"} value={form.income ? `₹${Number(form.income).toLocaleString("en-IN")}` : ""} />
                  </>
                )}
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2"
                style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
                <GraduationCap size={15} className="text-blue-300" />
                <h3 className="text-sm font-bold text-white">{t("academicInformation") || "Academic Information"}</h3>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editing ? (
                  <>
                    <div>
                      <label className={lbl}>Course / Degree</label>
                      <input className={inp} value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} placeholder="e.g. B.Tech Computer Engineering" />
                    </div>
                    <div>
                      <label className={lbl}>University / College</label>
                      <input className={inp} value={form.university} onChange={e => setForm({ ...form, university: e.target.value })} placeholder="e.g. Gujarat Technological University" />
                    </div>
                    <div>
                      <label className={lbl}>Current Year</label>
                      <select className={inp} value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                        <option value="">Select year</option>
                        {YEARS.map(y => <option key={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={lbl}>Enrollment Number</label>
                      <input className={inp} value={form.enrollment} onChange={e => setForm({ ...form, enrollment: e.target.value })} placeholder="e.g. GTU2023CE001" />
                    </div>
                    <div>
                      <label className={lbl}>10th Percentage</label>
                      <input className={inp} value={form.tenth} onChange={e => setForm({ ...form, tenth: e.target.value })} placeholder="e.g. 88%" />
                    </div>
                    <div>
                      <label className={lbl}>12th Percentage</label>
                      <input className={inp} value={form.twelfth} onChange={e => setForm({ ...form, twelfth: e.target.value })} placeholder="e.g. 91%" />
                    </div>
                  </>
                ) : (
                  <>
                    <InfoRow icon={<GraduationCap size={15} />} label={t("course") || "Course"}                value={form.course}     />
                    <InfoRow icon={<GraduationCap size={15} />} label="University"                             value={form.university} />
                    <InfoRow icon={<GraduationCap size={15} />} label={t("year") || "Year"}                   value={form.year}       />
                    <InfoRow icon={<GraduationCap size={15} />} label="Enrollment Number"                     value={form.enrollment} />
                    <InfoRow icon={<GraduationCap size={15} />} label={t("tenthPercentage") || "10th %"}      value={form.tenth}      />
                    <InfoRow icon={<GraduationCap size={15} />} label={t("twelfthPercentage") || "12th %"}    value={form.twelfth}    />
                  </>
                )}
              </div>
            </div>

            {/* Save button at bottom when editing */}
            {editing && (
              <div className="flex gap-3 pb-4">
                <button onClick={handleSave} disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition shadow-sm"
                  style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save Changes</>}
                </button>
                <button onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition">
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
        style={{ background: "linear-gradient(135deg,#1a2744,#1e6fff)" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value || <span className="text-muted-foreground/50 font-normal">Not set</span>}</p>
      </div>
    </div>
  )
}
