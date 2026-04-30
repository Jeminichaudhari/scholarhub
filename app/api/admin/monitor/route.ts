export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import AdminAlert from "@/models/AdminAlert";

// ─── helpers ────────────────────────────────────────────────────────────────

function priority(field: string): "urgent" | "high" | "medium" | "low" {
  if (field === "deadline" || field === "status") return "urgent";
  if (field === "amount")                          return "high";
  if (field === "eligibility")                     return "medium";
  return "low";
}

function suggestAction(field: string, newVal: string, title: string): string {
  switch (field) {
    case "deadline":    return `Update deadline to ${newVal} for "${title}"`;
    case "amount":      return `Update scholarship amount to ₹${newVal} for "${title}"`;
    case "status":      return `Mark "${title}" as ${newVal}`;
    case "eligibility": return `Review and update eligibility criteria for "${title}"`;
    default:            return `Review changes to ${field} for "${title}"`;
  }
}

// ─── Fetch & parse a scholarship's official page ────────────────────────────
async function scrapeScholarshipPage(url: string): Promise<{
  ok: boolean;
  deadline?: string;
  amount?: string;
  status?: string;
  eligibility?: string;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ScholarHubBot/1.0)" },
    });
    clearTimeout(timeout);

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const html = await res.text();

    // ── Extract deadline ──────────────────────────────────────────────────
    // Looks for patterns like "Last Date: 31 December 2026" or "Deadline: 2026-12-31"
    const deadlinePatterns = [
      /(?:last\s*date|deadline|closing\s*date|apply\s*by|last\s*date\s*to\s*apply)[:\s]+([0-9]{1,2}[\s\-\/][A-Za-z]+[\s\-\/][0-9]{4})/i,
      /(?:last\s*date|deadline|closing\s*date)[:\s]+([0-9]{4}[\-\/][0-9]{1,2}[\-\/][0-9]{1,2})/i,
      /(?:last\s*date|deadline)[:\s]+([A-Za-z]+\s+[0-9]{1,2},?\s+[0-9]{4})/i,
    ];
    let deadline: string | undefined;
    for (const pat of deadlinePatterns) {
      const m = html.match(pat);
      if (m?.[1]) { deadline = m[1].trim(); break; }
    }

    // ── Extract amount ────────────────────────────────────────────────────
    const amountPatterns = [
      /(?:scholarship\s*amount|award|stipend|grant)[:\s]+(?:rs\.?|₹|inr)?\s*([0-9,]+)/i,
      /(?:rs\.?|₹)\s*([0-9,]+)\s*(?:per\s*(?:year|month|annum))?/i,
    ];
    let amount: string | undefined;
    for (const pat of amountPatterns) {
      const m = html.match(pat);
      if (m?.[1]) { amount = m[1].replace(/,/g, "").trim(); break; }
    }

    // ── Extract status ────────────────────────────────────────────────────
    const statusPatterns = [
      /(?:application\s*status|status)[:\s]+(open|closed|upcoming|active|inactive)/i,
      /\b(applications?\s*(?:are\s*)?(?:now\s*)?(?:open|closed|upcoming))\b/i,
    ];
    let status: string | undefined;
    for (const pat of statusPatterns) {
      const m = html.match(pat);
      if (m?.[1]) {
        const raw = m[1].toLowerCase();
        if (raw.includes("open") || raw.includes("active")) status = "active";
        else if (raw.includes("closed") || raw.includes("inactive")) status = "closed";
        else if (raw.includes("upcoming")) status = "upcoming";
        break;
      }
    }

    return { ok: true, deadline, amount, status };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Unreachable" };
  }
}

// ─── Compare & generate alerts ───────────────────────────────────────────────
async function checkScholarship(s: any): Promise<void> {
  if (!s.applyLink) return;

  const scraped = await scrapeScholarshipPage(s.applyLink);

  if (!scraped.ok) {
    // Source unreachable — log warning (no duplicate)
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s._id.toString(), field: "source", status: "pending" },
        {
          scholarshipId:    s._id.toString(),
          scholarshipTitle: s.title,
          sourceUrl:        s.applyLink,
          field:            "source",
          oldValue:         "",
          newValue:         "",
          suggestedAction:  `Check if the official website is reachable: ${s.applyLink}`,
          priority:         "low",
          isWarning:        true,
          warningMessage:   `Source unreachable: ${scraped.error}`,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
    } catch {}
    return;
  }

  const checks: { field: string; oldVal: string; newVal: string }[] = [];

  // ── Deadline check ────────────────────────────────────────────────────────
  if (scraped.deadline) {
    const storedDeadline = s.deadline
      ? new Date(s.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : "Not set";
    const scrapedNorm = scraped.deadline.trim();
    if (storedDeadline !== scrapedNorm) {
      checks.push({ field: "deadline", oldVal: storedDeadline, newVal: scrapedNorm });
    }
  }

  // ── Amount check ──────────────────────────────────────────────────────────
  if (scraped.amount) {
    const storedAmount = String(s.amount || "");
    const scrapedAmount = scraped.amount.replace(/,/g, "");
    if (storedAmount !== scrapedAmount && scrapedAmount !== "0") {
      checks.push({ field: "amount", oldVal: `₹${storedAmount}`, newVal: `₹${scrapedAmount}` });
    }
  }

  // ── Status check ──────────────────────────────────────────────────────────
  if (scraped.status) {
    const storedStatus = s.isActive ? "active" : "closed";
    if (storedStatus !== scraped.status) {
      checks.push({ field: "status", oldVal: storedStatus, newVal: scraped.status });
    }
  }

  // ── Save alerts (upsert to avoid duplicates) ──────────────────────────────
  for (const c of checks) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s._id.toString(), field: c.field, newValue: c.newVal, status: "pending" },
        {
          scholarshipId:    s._id.toString(),
          scholarshipTitle: s.title,
          sourceUrl:        s.applyLink,
          field:            c.field,
          oldValue:         c.oldVal,
          newValue:         c.newVal,
          suggestedAction:  suggestAction(c.field, c.newVal, s.title),
          priority:         priority(c.field),
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
    } catch {}
  }
}

// ─── POST /api/admin/monitor — run a full check ──────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  await connectDB();

  const scholarships = await Scholarship.find({ isActive: true, applyLink: { $exists: true, $ne: "" } });

  if (scholarships.length === 0)
    return NextResponse.json({ message: "No scholarships with apply links found.", checked: 0 });

  // Run checks in parallel (max 5 at a time to avoid rate limiting)
  const BATCH = 5;
  let checked = 0;
  for (let i = 0; i < scholarships.length; i += BATCH) {
    const batch = scholarships.slice(i, i + BATCH);
    await Promise.all(batch.map(s => checkScholarship(s)));
    checked += batch.length;
  }

  return NextResponse.json({ message: `Checked ${checked} scholarship(s).`, checked });
}

// ─── GET /api/admin/monitor — fetch all pending alerts ───────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  await connectDB();

  const alerts = await AdminAlert.find({ status: "pending" })
    .sort({ priority: 1, createdAt: -1 })
    .lean();

  // Sort: urgent first, then warnings last
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...alerts].sort((a, b) => {
    if (a.isWarning !== b.isWarning) return a.isWarning ? 1 : -1;
    return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
  });

  return NextResponse.json({ alerts: sorted });
}

// ─── PATCH /api/admin/monitor — dismiss or mark applied ──────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  const { id, action } = await req.json(); // action: "dismiss" | "applied" | "dismiss-all"
  await connectDB();

  if (action === "dismiss-all") {
    await AdminAlert.updateMany({ status: "pending" }, { status: "dismissed" });
    return NextResponse.json({ ok: true });
  }

  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  await AdminAlert.findByIdAndUpdate(id, {
    status: action === "applied" ? "applied" : "dismissed",
  });

  return NextResponse.json({ ok: true });
}
