"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/lib/language-context"
import { GraduationCap, Globe, Menu, X, Search, ChevronDown, Check } from "lucide-react"
import type { Language } from "@/lib/translations"

const LANGS: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English",  native: "English"  },
  { code: "hi", label: "Hindi",    native: "हिन्दी"    },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
];

export function Navbar() {
  const { t, lang, setLang } = useLanguage()
  const pathname = usePathname()

  const hideLogin =
    pathname.startsWith("/student") ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register"

  // Hide entire navbar on login/register
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [active, setActive] = useState("home")
  const [searchQuery, setSearchQuery] = useState("")
  const langRef = useRef<HTMLDivElement>(null)

  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0]

  // Close lang dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (pathname !== "/") return

    const handleScroll = () => {
      const section = document.getElementById("scholarships")
      if (!section) return

      const rect = section.getBoundingClientRect()

      if (rect.top <= 120 && rect.bottom >= 120) {
        setActive("scholarships")
      } else {
        setActive("home")
      }
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])

  useEffect(() => {
    if (pathname === "/contact") {
      setActive("contact")
    }
  }, [pathname])

  const navItems = [
    { id: "home", label: t("home"), href: "/" },
    { id: "scholarships", label: t("scholarships"), href: "/#scholarships" },
    { id: "contact", label: t("contactUs"), href: "/contact" },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-semibold text-gray-800">
            ScholarHub
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">

          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                active === item.id
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Login (Hidden on admin/student/auth pages) */}
          {!hideLogin && (
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {t("login") || "Login"}
            </Link>
          )}

          {/* Language dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Globe className="h-4 w-4 text-gray-400" />
              <span>{currentLang.native}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code as Language); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                      lang === l.code ? "text-blue-600 font-semibold bg-blue-50/60" : "text-gray-700"
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-semibold leading-none">{l.native}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{l.label}</p>
                    </div>
                    {lang === l.code && <Check className="h-3.5 w-3.5 ml-auto text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 pb-6 space-y-4 bg-white border-t">

          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}

          {!hideLogin && (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 rounded-lg text-sm bg-primary text-white text-center"
            >
              {t("login") || "Login"}
            </Link>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          {/* Mobile language switcher */}
          <div className="flex gap-2 pt-1">
            {LANGS.map(l => (
              <button key={l.code} onClick={() => setLang(l.code as Language)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-semibold transition ${
                  lang === l.code ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {l.native}
              </button>
            ))}
          </div>

        </div>
      )}
    </nav>
  )
}