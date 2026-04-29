"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, Info, CheckCircle2, AlertTriangle, Zap } from "lucide-react";

interface Notif {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "urgent";
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG = {
  info:    { icon: <Info size={14} />,          color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "Info"    },
  success: { icon: <CheckCircle2 size={14} />,  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Success" },
  warning: { icon: <AlertTriangle size={14} />, color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Warning" },
  urgent:  { icon: <Zap size={14} />,           color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Urgent"  },
};

export default function StudentNotificationBell() {
  const [open, setOpen]               = useState(false);
  const [notifications, setNotifs]    = useState<Notif[]>([]);
  const [loading, setLoading]         = useState(false);
  const ref                           = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch on mount and every 60s
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
  }, []);

  async function fetchNotifs() {
    setLoading(true);
    try {
      const res = await fetch("/api/student/notifications");
      const data = await res.json();
      setNotifs(data.notifications || []);
    } catch {}
    setLoading(false);
  }

  async function markAllRead() {
    await fetch("/api/student/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/student/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  }

  async function deleteNotif(id: string) {
    await fetch("/api/student/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs(prev => prev.filter(n => n._id !== id));
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(v => !v); if (!open) fetchNotifs(); }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }}
        title="Notifications"
      >
        <Bell size={16} className="text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ border: "1px solid #e2e8f0" }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-blue-300" />
              <p className="text-white font-bold text-sm">Notifications</p>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] text-blue-300 hover:text-white transition font-semibold">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-300 text-xs mt-0.5">We'll notify you about new scholarships</p>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                return (
                  <div key={n._id}
                    onClick={() => !n.read && markRead(n._id)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? "bg-blue-50/40" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold truncate ${!n.read ? "text-gray-900" : "text-gray-600"}`}>
                            {n.title}
                          </p>
                          <button onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                            className="text-gray-300 hover:text-red-400 transition flex-shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">{notifications.length} total notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
