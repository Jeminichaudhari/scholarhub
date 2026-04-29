"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, History, FolderOpen, User, BookOpen, LayoutDashboard } from "lucide-react";

// Pages that can be navigated to by keyword
const PAGE_SHORTCUTS = [
  {
    keywords: ["history", "application history", "my applications", "applied", "status"],
    label: "Application History",
    href: "/student/history",
    icon: <History size={14} />,
    color: "#f97316",
  },
  {
    keywords: ["document", "documents", "vault", "document vault", "upload", "files", "aadhaar", "certificate"],
    label: "Document Vault",
    href: "/student/documents",
    icon: <FolderOpen size={14} />,
    color: "#0d9488",
  },
  {
    keywords: ["profile", "edit profile", "my profile", "account", "personal"],
    label: "Edit Profile",
    href: "/student/profile",
    icon: <User size={14} />,
    color: "#1e6fff",
  },
  {
    keywords: ["dashboard", "home", "main", "scholarships"],
    label: "Dashboard",
    href: "/student",
    icon: <LayoutDashboard size={14} />,
    color: "#1a2744",
  },
];

interface Props {
  // If provided, filters scholarships inline instead of redirecting
  value?: string;
  onChange?: (val: string) => void;
}

export default function StudentSmartSearch({ value, onChange }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<typeof PAGE_SHORTCUTS>([]);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => { if (value !== undefined) setQ(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleChange(val: string) {
    setQ(val);
    onChange?.(val); // update parent (scholarship filter)

    // Show page suggestions if query matches
    if (val.trim().length > 0) {
      const lower = val.toLowerCase();
      const matched = PAGE_SHORTCUTS.filter(p =>
        p.keywords.some(k => k.includes(lower) || lower.includes(k.split(" ")[0]))
      );
      setSuggestions(matched);
    } else {
      setSuggestions([]);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && q.trim()) {
      // Check if it's a page navigation query
      const lower = q.toLowerCase().trim();
      const pageMatch = PAGE_SHORTCUTS.find(p =>
        p.keywords.some(k => lower === k || k.startsWith(lower))
      );
      if (pageMatch) {
        router.push(pageMatch.href);
        setQ(""); setSuggestions([]); setFocused(false);
      } else if (!onChange) {
        // On non-dashboard pages, redirect to dashboard with query
        router.push(`/student?q=${encodeURIComponent(q.trim())}`);
        setQ(""); setSuggestions([]);
      }
    }
    if (e.key === "Escape") { setFocused(false); setSuggestions([]); }
  }

  function handleSuggestionClick(href: string) {
    router.push(href);
    setQ(""); setSuggestions([]); setFocused(false);
  }

  function clear() {
    setQ(""); onChange?.(""); setSuggestions([]);
  }

  return (
    <div ref={ref} className="relative w-full max-w-lg hidden md:block">
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3 text-blue-300 pointer-events-none z-10" />
        <input
          type="text"
          value={q}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          placeholder="Search scholarships, history, documents..."
          className="w-full pl-9 pr-9 py-2 rounded-xl text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
          style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}
        />
        {q && (
          <button onClick={clear} className="absolute right-3 text-blue-300 hover:text-white z-10">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {focused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5"
          style={{ border: "1px solid #e2e8f0" }}>
          <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Go to page</p>
          {suggestions.map(s => (
            <button key={s.href} onClick={() => handleSuggestionClick(s.href)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                style={{ background: s.color }}>
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-400">{s.href}</p>
              </div>
              <span className="ml-auto text-xs text-gray-300 group-hover:text-gray-500">↵ Enter</span>
            </button>
          ))}
          {onChange && q.trim() && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
                <BookOpen size={12} />
                Filtering scholarships for "<span className="font-semibold text-gray-600">{q}</span>"
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
