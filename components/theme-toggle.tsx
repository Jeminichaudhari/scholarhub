"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return (
    <div className="w-9 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.10)" }} />
  );

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:opacity-80 active:scale-95"
      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
    >
      {isDark
        ? <Sun  size={16} className="text-amber-300 transition-transform duration-300 rotate-0" />
        : <Moon size={16} className="text-blue-200 transition-transform duration-300 rotate-0" />
      }
    </button>
  );
}
