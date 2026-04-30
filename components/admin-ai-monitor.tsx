"use client";

import { useState, useEffect, useCallback } from "react";
import { useScholarshipStore } from "@/lib/use-scholarship-store";
import {
  Bot, RefreshCw, AlertTriangle, CheckCircle2,
  ExternalLink, ChevronDown, ChevronUp, Trash2, Check,
  WifiOff, Zap, History, X, Info, Clock
} from "lucide-react";

interface Alert {
  _id:              string;
  scholarshipId:    string;
  scholarshipTitle: string;
  sourceUrl:        string;
  field:            string;
  oldValue:         string;
  newValue:         string;
  suggestedAction:  string;
  priority:         "urgent" | "high" | "medium" | "low";
  status:           "pending" | "dismissed" | "applied";
  isWarning:        boolean;
  warningMessage?:  string;
  createdAt:        string;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent",  bg: "#fef2f2", border: "#fca5a5", badge: "#dc2626", text: "#991b1b" },
  high:   { label: "High",    bg: "#fff7ed", border: "#fdba74", badge: "#ea580c", text: "#9a3412" },
  medium: { label: "Medium",  bg: "#fefce8", border: "#fde047", badge: "#ca8a04", text: "#854d0e" },
  low:    { label: "Low",     bg: "#f0fdf4", border: "#86efac", badge: "#16a34a", text: "#166534" },
};

const FIELD_LABELS: Record<string, string> = {
  deadline:      "Deadline Changed",
  deadline_soon: "Deadline Expiring Soon",
  amount:        "Amount Changed",
  status:        "Status Changed",
  eligibility:   "Eligibility Changed",
  applyLink:     "Missing Apply Link",
  source:        "Source Unreachable",
};

export default function AdminAIMonitor() {
  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [scanning,  setScanning]  = useState(false);
  const [scanMsg,   setScanMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());
  const [tab,       setTab]       = useState<"pending" | "history">("pending");
  const [history,   setHistory]   = useState<Alert[]>([]);
  const [histLoad,  setHistLoad]  = useState(false);

  // Get scholarships from localStorage store
  const { scholarships, isLoaded: storeLoaded } = useScholarshipStore();

  // ── Fetch pending alerts ──────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/monitor");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // ── Fetch history (dismissed + applied) ──────────────────────────────────
  async function fetchHistory() {
    setHistLoad(true);
    try {
      const res  = await fetch("/api/admin/monitor/history");
      const data = await res.json();
      setHistory(data.alerts || []);
    } catch {
      setHistory([]);
    } finally {
      setHistLoad(false);
    }
  }

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab]);

  // ── Run AI scan — sends scholarships from localStorage to API ───────────
  async function runScan() {
    if (!storeLoaded || scholarships.length === 0) {
      setScanMsg({ text: "No scholarships found to scan.", ok: false });
      return;
    }

    setScanning(true); setScanMsg(null);

    // Build payload from localStorage scholarships
    const payload = scholarships.map(s => ({
      id:          s.id,
      title:       s.title,
      amount:      s.amount,
      deadline:    s.deadline,
      isActive:    new Date(s.deadline) >= new Date(),
      applyLink:   s.applyLink || "",
      eligibility: s.eligibility || "",
    }));

    try {
      const res  = await fetch("/api/admin/monitor", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ scholarships: payload }),
      });
      const data = await res.json();
      setScanMsg({ text: data.message, ok: res.ok });
      await fetchAlerts();
    } catch {
      setScanMsg({ text: "Scan failed. Please try again.", ok: false });
    } finally {
      setScanning(false);
    }
  }

  // ── Dismiss / Apply ───────────────────────────────────────────────────────
  async function handleAction(id: string, action: "dismiss" | "applied") {
    await fetch("/api/admin/monitor", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id, action }),
    });
    setAlerts(prev => prev.filter(a => a._id !== id));
  }

  async function dismissAll() {
    if (!window.confirm("Dismiss all pending alerts?")) return;
    await fetch("/api/admin/monitor", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "dismiss-all" }),
    });
    setAlerts([]);
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const urgentCount  = alerts.filter(a => a.priority === "urgent"  && !a.isWarning).length;
  const highCount    = alerts.filter(a => a.priority === "high"    && !a.isWarning).length;
  const warningCount = alerts.filter(a => a.isWarning).length;
  const changeCount  = alerts.filter(a => !a.isWarning).length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="rounded-2xl overflow-hidden shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4"
          style={{ background: "linear-gradient(135deg,#1a2744,#1e3a6e)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <Bot size={18} className="text-blue-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Scholarship Monitor</h2>
              <p className="text-xs text-blue-300 mt-0.5">
                Automatically detects changes on official scholarship websites
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition"
              style={{ background: "linear-gradient(135deg,#1e6fff,#2563eb)" }}>
              <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
              {scanning ? "Scanning..." : "Run AI Scan"}
            </button>
          </div>
        </div>

        {/* Scan result message */}
        {scanMsg && (
          <div className={`px-5 py-3 text-sm flex items-center gap-2 border-b ${
            scanMsg.ok
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}>
            {scanMsg.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
            {scanMsg.text}
            <button onClick={() => setScanMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 bg-white border-b border-gray-100">
          <StatPill icon={<Zap size={14} />}          label="Urgent Changes"    value={urgentCount}               color="#dc2626" bg="#fef2f2" />
          <StatPill icon={<AlertTriangle size={14} />} label="High Priority"     value={highCount}                 color="#ea580c" bg="#fff7ed" />
          <StatPill icon={<Info size={14} />}          label="Total Changes"     value={changeCount}               color="#2563eb" bg="#eff6ff" />
          <StatPill icon={<WifiOff size={14} />}       label="Unreachable Sites" value={warningCount}              color="#6b7280" bg="#f9fafb" />
        </div>

        {/* Scholarships loaded info */}
        <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-700">
          <Info size={12} />
          <span>
            {storeLoaded
              ? <><b>{scholarships.length}</b> scholarships loaded from your dashboard — ready to scan</>
              : "Loading scholarships..."}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: "#e2e8f0" }}>
        {(["pending", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t === "pending"
              ? `🔔 Pending Alerts ${alerts.length > 0 ? `(${alerts.length})` : ""}`
              : "📋 History"}
          </button>
        ))}
      </div>

      {/* ── Pending Alerts ── */}
      {tab === "pending" && (
        <div className="rounded-2xl overflow-hidden shadow-md">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
            <p className="text-sm font-semibold text-gray-700">
              {loading ? "Loading..." : alerts.length === 0
                ? "No pending alerts"
                : `${alerts.length} alert${alerts.length > 1 ? "s" : ""} detected`}
            </p>
            {alerts.length > 0 && (
              <button onClick={dismissAll}
                className="text-xs text-gray-400 hover:text-red-500 transition flex items-center gap-1">
                <Trash2 size={12} /> Dismiss All
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 bg-white">
              <RefreshCw size={24} className="animate-spin text-blue-400" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white gap-3">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <p className="text-gray-500 text-sm font-medium">All scholarships are up to date!</p>
              <p className="text-gray-400 text-xs">Run a scan to check for new changes.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 bg-white">
              {alerts.map(alert => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  expanded={expanded.has(alert._id)}
                  onToggle={() => toggleExpand(alert._id)}
                  onDismiss={() => handleAction(alert._id, "dismiss")}
                  onApplied={() => handleAction(alert._id, "applied")}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === "history" && (
        <div className="rounded-2xl overflow-hidden shadow-md">
          <div className="px-5 py-3 border-b border-gray-100 bg-white">
            <p className="text-sm font-semibold text-gray-700">
              {histLoad ? "Loading history..." : `${history.length} resolved alert${history.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {histLoad ? (
            <div className="flex items-center justify-center py-16 bg-white">
              <RefreshCw size={24} className="animate-spin text-blue-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white gap-3">
              <History size={28} className="text-gray-300" />
              <p className="text-gray-400 text-sm">No history yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 bg-white">
              {history.map(alert => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  expanded={expanded.has(alert._id)}
                  onToggle={() => toggleExpand(alert._id)}
                  readonly
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Alert Card ────────────────────────────────────────────────────────────────
function AlertCard({
  alert, expanded, onToggle, onDismiss, onApplied, readonly
}: {
  alert:     Alert;
  expanded:  boolean;
  onToggle:  () => void;
  onDismiss?: () => void;
  onApplied?: () => void;
  readonly?:  boolean;
}) {
  const cfg = PRIORITY_CONFIG[alert.priority];

  return (
    <div className="transition-colors hover:bg-gray-50">
      {/* Row */}
      <div className="flex items-start gap-3 px-5 py-4 cursor-pointer" onClick={onToggle}>
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {alert.isWarning
            ? <WifiOff size={16} className="text-gray-400" />
            : alert.priority === "urgent"
              ? <Zap size={16} className="text-red-500" />
              : <AlertTriangle size={16} style={{ color: cfg.badge }} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {alert.scholarshipTitle}
            </span>
            {/* Priority badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
              {cfg.label}
            </span>
            {/* Field badge */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {FIELD_LABELS[alert.field] || alert.field}
            </span>
            {/* Status badge for history */}
            {readonly && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                alert.status === "applied"
                  ? "bg-green-50 text-green-700 border border-green-100"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}>
                {alert.status === "applied" ? "✓ Applied" : "Dismissed"}
              </span>
            )}
          </div>

          {alert.isWarning ? (
            <p className="text-xs text-gray-500">{alert.warningMessage}</p>
          ) : (
            <p className="text-xs text-gray-500">
              <span className="line-through text-red-400">{alert.oldValue}</span>
              <span className="mx-1.5 text-gray-300">→</span>
              <span className="font-semibold text-green-700">{alert.newValue}</span>
            </p>
          )}

          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(alert.createdAt).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4 ml-7">
          <div className="rounded-xl border p-4 space-y-3 text-sm"
            style={{ background: cfg.bg, borderColor: cfg.border }}>

            {/* Change detail */}
            {!alert.isWarning && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-white border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Field Changed</p>
                  <p className="font-semibold text-gray-800">{FIELD_LABELS[alert.field] || alert.field}</p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Old Value</p>
                  <p className="font-semibold text-red-700 line-through">{alert.oldValue || "—"}</p>
                </div>
                <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                  <p className="text-[10px] font-bold text-green-500 uppercase mb-1">New Value</p>
                  <p className="font-semibold text-green-700">{alert.newValue || "—"}</p>
                </div>
              </div>
            )}

            {/* Suggested action */}
            <div className="rounded-lg bg-white border border-gray-100 p-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">💡 Suggested Action</p>
              <p className="text-gray-700 font-medium">{alert.suggestedAction}</p>
            </div>

            {/* Source link */}
            <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              <ExternalLink size={12} /> View Official Source
            </a>

            {/* Actions */}
            {!readonly && (
              <div className="flex gap-2 pt-1">
                <button onClick={onApplied}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition"
                  style={{ background: "linear-gradient(135deg,#0d9488,#0f766e)" }}>
                  <Check size={12} /> Mark as Applied
                </button>
                <button onClick={onDismiss}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-100 transition">
                  <X size={12} /> Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value, color, bg }: {
  icon: React.ReactNode; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: bg }}>
      <div style={{ color }}>{icon}</div>
      <div>
        <p className="text-lg font-bold leading-none" style={{ color }}>{value}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
