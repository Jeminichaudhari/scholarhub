export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import AdminAlert from "@/models/AdminAlert";

// ─── helpers ────────────────────────────────────────────────────────────────

function getPriority(field: string): "urgent" | "high" | "medium" | "low" {
  if (field === "deadline" || field === "status") return "urgent";
  if (field === "amount")                          return "high";
  if (field === "eligibility")                     return "medium";
  return "low";
}

function getSuggestedAction(field: string, newVal: string, title: string): string {
  switch (field) {
    case "deadline":    return `Update deadline to "${newVal}" for "${title}"`;
    case "amount":      return `Update scholarship amount to ₹${newVal} for "${title}"`;
    case "status":      return `Mark "${title}" as ${newVal}`;
    case "eligibility": return `Review and update eligibility criteria for "${title}"`;
    case "title":       return `Rename scholarship to "${newVal}"`;
    default:            return `Review changes to ${field} for "${title}"`;
  }
}

// ─── Fetch & parse a scholarship's official page ────────────────────────────
async function scrapeScholarshipPage(url: string): Promise<{
  ok:           boolean;
  deadline?:    string;
  amount?:      string;
  status?:      string;
  eligibility?: string;
  error?:       string;
}> {
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal:  controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept":     "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };

    const html = await res.text();

    // ── Deadline ─────────────────────────────────────────────────────────
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

    // ── Amount ────────────────────────────────────────────────────────────
    const amountPatterns = [
      /(?:scholarship\s*amount|award|stipend|grant)[:\s]+(?:rs\.?|₹|inr)?\s*([0-9,]+)/i,
      /(?:rs\.?|₹)\s*([0-9,]+)\s*(?:per\s*(?:year|month|annum))?/i,
    ];
    let amount: string | undefined;
    for (const pat of amountPatterns) {
      const m = html.match(pat);
      if (m?.[1]) { amount = m[1].replace(/,/g, "").trim(); break; }
    }

    // ── Status ────────────────────────────────────────────────────────────
    let status: string | undefined;
    if (/applications?\s*(are\s*)?(now\s*)?open/i.test(html))       status = "active";
    else if (/applications?\s*(are\s*)?closed/i.test(html))         status = "closed";
    else if (/coming\s*soon|upcoming|not\s*yet\s*open/i.test(html)) status = "upcoming";

    return { ok: true, deadline, amount, status };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Unreachable" };
  }
}

// ─── Analyse a single scholarship and save alerts ────────────────────────────
async function analyseScholarship(s: {
  id: string; title: string; amount: string; deadline: string;
  isActive: boolean; applyLink: string; eligibility: string;
}): Promise<{ changes: number; warning: boolean }> {

  let changes = 0;
  let warning = false;

  // ── 1. Deadline already passed but still marked active ───────────────────
  const deadlineDate = new Date(s.deadline);
  const now          = new Date();
  const daysLeft     = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (s.isActive && daysLeft < 0) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "status", newValue: "closed", status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        s.applyLink || "#",
          field:            "status",
          oldValue:         "active",
          newValue:         "closed",
          suggestedAction:  `Mark "${s.title}" as closed — deadline passed ${Math.abs(daysLeft)} day(s) ago`,
          priority:         "urgent",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // ── 2. Deadline expiring very soon (within 7 days) ───────────────────────
  if (s.isActive && daysLeft >= 0 && daysLeft <= 7) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "deadline_soon", newValue: String(daysLeft), status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        s.applyLink || "#",
          field:            "deadline_soon",
          oldValue:         "",
          newValue:         String(daysLeft),
          suggestedAction:  `Deadline for "${s.title}" is in ${daysLeft} day(s) — notify students urgently`,
          priority:         daysLeft <= 2 ? "urgent" : "high",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // ── 3. Missing apply link ─────────────────────────────────────────────────
  if (!s.applyLink || s.applyLink.trim() === "") {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "applyLink", newValue: "missing", status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        "#",
          field:            "applyLink",
          oldValue:         "Not set",
          newValue:         "missing",
          suggestedAction:  `Add an official apply link for "${s.title}"`,
          priority:         "medium",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
    // Can't scrape without a URL — stop here
    return { changes, warning };
  }

  // ── 4. Scrape official page for live changes ──────────────────────────────
  const scraped = await scrapeScholarshipPage(s.applyLink);

  if (!scraped.ok) {
    // Source unreachable — log warning
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "source", status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        s.applyLink,
          field:            "source",
          oldValue:         "",
          newValue:         "",
          suggestedAction:  `Verify the official website is reachable: ${s.applyLink}`,
          priority:         "low",
          isWarning:        true,
          warningMessage:   `Source unreachable: ${scraped.error}`,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
    } catch {}
    warning = true;
    return { changes, warning };
  }

  // ── 5. Compare scraped deadline vs stored ─────────────────────────────────
  if (scraped.deadline) {
    const storedStr  = deadlineDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const scrapedStr = scraped.deadline.trim();
    if (storedStr.toLowerCase() !== scrapedStr.toLowerCase()) {
      try {
        await AdminAlert.findOneAndUpdate(
          { scholarshipId: s.id, field: "deadline", newValue: scrapedStr, status: "pending" },
          {
            scholarshipId:    s.id,
            scholarshipTitle: s.title,
            sourceUrl:        s.applyLink,
            field:            "deadline",
            oldValue:         storedStr,
            newValue:         scrapedStr,
            suggestedAction:  getSuggestedAction("deadline", scrapedStr, s.title),
            priority:         getPriority("deadline"),
            isWarning:        false,
            status:           "pending",
          },
          { upsert: true, new: true }
        );
        changes++;
      } catch {}
    }
  }

  // ── 6. Compare scraped amount vs stored ───────────────────────────────────
  if (scraped.amount) {
    const storedAmount  = s.amount.replace(/[₹,\s]/g, "");
    const scrapedAmount = scraped.amount.replace(/,/g, "");
    if (storedAmount !== scrapedAmount && scrapedAmount !== "0") {
      try {
        await AdminAlert.findOneAndUpdate(
          { scholarshipId: s.id, field: "amount", newValue: scrapedAmount, status: "pending" },
          {
            scholarshipId:    s.id,
            scholarshipTitle: s.title,
            sourceUrl:        s.applyLink,
            field:            "amount",
            oldValue:         `₹${storedAmount}`,
            newValue:         `₹${scrapedAmount}`,
            suggestedAction:  getSuggestedAction("amount", scrapedAmount, s.title),
            priority:         getPriority("amount"),
            isWarning:        false,
            status:           "pending",
          },
          { upsert: true, new: true }
        );
        changes++;
      } catch {}
    }
  }

  // ── 7. Compare scraped status vs stored ───────────────────────────────────
  if (scraped.status) {
    const storedStatus = s.isActive ? "active" : "closed";
    if (storedStatus !== scraped.status) {
      try {
        await AdminAlert.findOneAndUpdate(
          { scholarshipId: s.id, field: "status", newValue: scraped.status, status: "pending" },
          {
            scholarshipId:    s.id,
            scholarshipTitle: s.title,
            sourceUrl:        s.applyLink,
            field:            "status",
            oldValue:         storedStatus,
            newValue:         scraped.status,
            suggestedAction:  getSuggestedAction("status", scraped.status, s.title),
            priority:         getPriority("status"),
            isWarning:        false,
            status:           "pending",
          },
          { upsert: true, new: true }
        );
        changes++;
      } catch {}
    }
  }

  return { changes, warning };
}

// ─── POST — receive scholarships from client & run analysis ─────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const scholarships: {
    id: string; title: string; amount: string; deadline: string;
    isActive: boolean; applyLink: string; eligibility: string;
  }[] = body.scholarships || [];

  if (scholarships.length === 0)
    return NextResponse.json({ message: "No scholarships provided.", checked: 0, changes: 0 });

  await connectDB();

  let totalChanges = 0;
  let totalWarnings = 0;

  // Run in batches of 4 to avoid rate limiting
  const BATCH = 4;
  for (let i = 0; i < scholarships.length; i += BATCH) {
    const batch = scholarships.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(s => analyseScholarship(s)));
    results.forEach(r => {
      totalChanges  += r.changes;
      if (r.warning) totalWarnings++;
    });
  }

  return NextResponse.json({
    message:  `Scanned ${scholarships.length} scholarship(s). Found ${totalChanges} issue(s), ${totalWarnings} warning(s).`,
    checked:  scholarships.length,
    changes:  totalChanges,
    warnings: totalWarnings,
  });
}

// ─── GET — fetch all pending alerts ─────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  await connectDB();

  const alerts = await AdminAlert.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .lean();

  // Sort: urgent first, warnings last
  const order = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...alerts].sort((a, b) => {
    if (a.isWarning !== b.isWarning) return a.isWarning ? 1 : -1;
    return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
  });

  return NextResponse.json({ alerts: sorted });
}

// ─── PATCH — dismiss / mark applied ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  const { id, action } = await req.json();
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
