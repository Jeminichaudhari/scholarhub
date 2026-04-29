"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, Edit3, FolderOpen, LogOut, ChevronDown, GraduationCap, Bookmark, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function StudentProfileDropdown() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const name  = session?.user?.name  || "Student";
  const email = session?.user?.email || "";
  const initial = name.charAt(0).toUpperCase();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menuItems = [
    { icon: <Edit3 size={16} />,          label: t("editProfile")       || "Edit Profile",       href: "/student/profile",   color: "#1e6fff" },
    { icon: <FolderOpen size={16} />,     label: t("documents")         || "Documents",           href: "/student/documents", color: "#0d9488" },
    { icon: <Bookmark size={16} />,       label: t("savedScholarships") || "Saved Scholarships",  href: "/student/saved",     color: "#d97706" },
    { icon: <MessageCircle size={16} />,  label: t("contactUs")         || "Contact Us",          href: "/student/contact",   color: "#7c3aed" },
  ];

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
          {initial}
        </div>
        <span className="hidden sm:inline max-w-[100px] truncate">{name}</span>
        <ChevronDown size={14} className={`text-blue-300 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}>

          {/* Profile header */}
          <div className="px-4 py-4 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate">{name}</p>
              <p className="text-blue-300 text-xs truncate mt-0.5">{email}</p>
              <div className="flex items-center gap-1 mt-1">
                <GraduationCap size={10} className="text-blue-400" />
                <span className="text-blue-400 text-[10px] font-semibold uppercase tracking-wide">{t("studentRole") || "Student"}</span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ background: item.color }}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Divider + Logout */}
          <div className="border-t border-gray-100 py-1.5">
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/login" }); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform"
                style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>
                <LogOut size={16} />
              </div>
              <span className="font-medium">{t("logout") || "Logout"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
