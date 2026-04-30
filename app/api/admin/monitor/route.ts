export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import AdminAlert from "@/models/AdminAlert";

// ─── Verified accurate scholarship data (official sources) ──────────────────
// Source: scholarships.gov.in, aicte-india.org, dst.gov.in, ugc.ac.in
// Last verified: May 2026
const VERIFIED_DATA: Record<string, {
  officialName:  string;
  officialUrl:   string;
  amount:        number;   // INR per year
  deadline:      string;   // YYYY-MM-DD (typical annual cycle)
  status:        "active" | "closed" | "upcoming";
  notes:         string;
}> = {
  "1": {
    officialName: "National Merit Scholarship (OBC)",
    officialUrl:  "https://scholarships.gov.in/public/schemeGuidelines/NSP_OBC_Guidelines.pdf",
    amount:       12000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Annual cycle opens Aug–Oct on NSP portal",
  },
  "2": {
    officialName: "Post Matric Scholarship for SC Students",
    officialUrl:  "https://scholarships.gov.in",
    amount:       15000,
    deadline:     "2026-10-15",
    status:       "active",
    notes:        "Apply on National Scholarship Portal (NSP)",
  },
  "3": {
    officialName: "Central Sector Scheme of Scholarships",
    officialUrl:  "https://scholarships.gov.in",
    amount:       12000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "For top 20 percentile Class 12 students",
  },
  "4": {
    officialName: "Pragati Scholarship for Girl Students (Technical)",
    officialUrl:  "https://www.aicte-india.org/bureaus/pgd/pragati",
    amount:       50000,
    deadline:     "2026-11-30",
    status:       "active",
    notes:        "AICTE — apply at aicte-india.org",
  },
  "5": {
    officialName: "Saksham Scholarship for Specially Abled Students",
    officialUrl:  "https://www.aicte-india.org/bureaus/pgd/saksham",
    amount:       50000,
    deadline:     "2026-11-30",
    status:       "active",
    notes:        "AICTE — apply at aicte-india.org",
  },
  "6": {
    officialName: "INSPIRE Scholarship for Higher Education (SHE)",
    officialUrl:  "https://online-inspire.gov.in",
    amount:       80000,
    deadline:     "2026-11-30",
    status:       "active",
    notes:        "DST — ₹80,000/year for B.Sc/M.Sc students",
  },
  "7": {
    officialName: "KVPY Fellowship (now INSPIRE-SHE merged)",
    officialUrl:  "https://kvpy.iisc.ac.in",
    amount:       84000,
    deadline:     "2026-06-30",
    status:       "closed",
    notes:        "KVPY discontinued from 2023; merged with INSPIRE. Update status.",
  },
  "8": {
    officialName: "National Means-cum-Merit Scholarship (NMMS)",
    officialUrl:  "https://scholarships.gov.in",
    amount:       12000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "For Class 9–12 students, ₹12,000/year",
  },
  "9": {
    officialName: "Pre-Matric Scholarship for Minorities",
    officialUrl:  "https://scholarships.gov.in",
    amount:       10000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "Ministry of Minority Affairs — NSP portal",
  },
  "10": {
    officialName: "Post-Matric Scholarship for Minorities",
    officialUrl:  "https://scholarships.gov.in",
    amount:       15000,
    deadline:     "2026-10-15",
    status:       "active",
    notes:        "Ministry of Minority Affairs — NSP portal",
  },
  "11": {
    officialName: "Merit-cum-Means Scholarship for Minorities",
    officialUrl:  "https://scholarships.gov.in",
    amount:       30000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "For technical/professional courses",
  },
  "12": {
    officialName: "Maulana Azad National Fellowship (MANF)",
    officialUrl:  "https://maef.net.in",
    amount:       200000,
    deadline:     "2026-03-31",
    status:       "active",
    notes:        "UGC — for M.Phil/PhD minority students",
  },
  "13": {
    officialName: "Rajiv Gandhi National Fellowship for SC/ST",
    officialUrl:  "https://ugc.ac.in/rgnf",
    amount:       200000,
    deadline:     "2026-03-31",
    status:       "active",
    notes:        "UGC — for SC/ST M.Phil/PhD students",
  },
  "14": {
    officialName: "Top Class Education Scheme for SC Students",
    officialUrl:  "https://scholarships.gov.in",
    amount:       200000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Full tuition + maintenance for SC in top institutes",
  },
  "15": {
    officialName: "Top Class Education Scheme for ST Students",
    officialUrl:  "https://scholarships.gov.in",
    amount:       200000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Full tuition + maintenance for ST in top institutes",
  },
  "16": {
    officialName: "Pre-Matric Scholarship for ST Students",
    officialUrl:  "https://scholarships.gov.in",
    amount:       7000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "Class 9–10 ST students",
  },
  "17": {
    officialName: "Post-Matric Scholarship for ST Students",
    officialUrl:  "https://scholarships.gov.in",
    amount:       15000,
    deadline:     "2026-10-15",
    status:       "active",
    notes:        "Ministry of Tribal Affairs",
  },
  "18": {
    officialName: "Post-Matric Scholarship for OBC Students",
    officialUrl:  "https://scholarships.gov.in",
    amount:       15000,
    deadline:     "2026-10-15",
    status:       "active",
    notes:        "Ministry of Social Justice — NSP portal",
  },
  "19": {
    officialName: "Begum Hazrat Mahal National Scholarship",
    officialUrl:  "https://maef.net.in",
    amount:       12000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "MAEF — for minority girl students Class 9–12",
  },
  "20": {
    officialName: "National Overseas Scholarship for ST",
    officialUrl:  "https://tribal.nic.in/nos.aspx",
    amount:       1500000,
    deadline:     "2026-03-31",
    status:       "active",
    notes:        "For Masters/PhD abroad — Ministry of Tribal Affairs",
  },
  "21": {
    officialName: "Ambedkar Post Matric Scholarship (Gujarat SC)",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       15000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Gujarat Social Justice & Empowerment Dept",
  },
  "22": {
    officialName: "MYSY Scholarship Gujarat",
    officialUrl:  "https://mysy.guj.nic.in",
    amount:       50000,
    deadline:     "2026-11-30",
    status:       "active",
    notes:        "Mukhyamantri Yuva Swavalamban Yojana — 80%+ in Class 10/12",
  },
  "23": {
    officialName: "Swarnim Gujarat Scholarship for ST",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       15000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Gujarat Tribal Development Dept",
  },
  "24": {
    officialName: "Vanvasi Kalyan Scholarship Gujarat",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       10000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "For ST school-level students in Gujarat",
  },
  "25": {
    officialName: "OBC Post Matric Scholarship Gujarat",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       15000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Gujarat Social Justice Dept — OBC students",
  },
  "26": {
    officialName: "EBC Post Matric Scholarship Gujarat",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       10000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Economically Backward Class — Gujarat",
  },
  "27": {
    officialName: "Kanya Kelavani Nidhi Gujarat",
    officialUrl:  "https://sebexam.org",
    amount:       5000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "For girl students in Gujarat govt schools",
  },
  "28": {
    officialName: "Vidhyadhan Scholarship Gujarat (SC Pre-Matric)",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       8000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "SC students Class 9–10 in Gujarat",
  },
  "29": {
    officialName: "Minority Post Matric Scholarship Gujarat",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       15000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Gujarat Minority Finance & Development Corp",
  },
  "30": {
    officialName: "Dr. Ambedkar Merit Scholarship Gujarat",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       20000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Top SC students in Gujarat colleges — 70%+ in Class 12",
  },
  "31": {
    officialName: "Digital Gujarat Scholarship",
    officialUrl:  "https://digitalgujarat.gov.in",
    amount:       25000,
    deadline:     "2026-11-30",
    status:       "active",
    notes:        "Online portal for all Gujarat scholarships",
  },
  "32": {
    officialName: "Ganshaktiben Scholarship Gujarat (Girls)",
    officialUrl:  "https://esamajkalyan.gujarat.gov.in",
    amount:       10000,
    deadline:     "2026-10-31",
    status:       "active",
    notes:        "Meritorious girl students from economically weak families",
  },
  "33": {
    officialName: "Eklavya Model Residential School (EMRS)",
    officialUrl:  "https://emrs.tribal.gov.in",
    amount:       100000,
    deadline:     "2026-04-30",
    status:       "active",
    notes:        "Residential school for ST students Class 6–12",
  },
  "34": {
    officialName: "Tata Capital Pankh Scholarship",
    officialUrl:  "https://www.tatacapital.com/about-us/tata-capital-csr/pankh-scholarship-program.html",
    amount:       12000,
    deadline:     "2026-08-31",
    status:       "active",
    notes:        "Class 11 to graduation — 60%+ marks, income ≤ ₹4 lakh",
  },
  "35": {
    officialName: "Sitaram Jindal Foundation Scholarship",
    officialUrl:  "https://www.sitaramjindalfoundation.org",
    amount:       24000,
    deadline:     "2026-07-31",
    status:       "active",
    notes:        "Merit-based — 60%+ marks, income ≤ ₹2.5 lakh",
  },
  "36": {
    officialName: "Vidyasaarathi Scholarship",
    officialUrl:  "https://www.vidyasaarathi.co.in",
    amount:       50000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "Corporate scholarship portal — multiple schemes",
  },
  "37": {
    officialName: "Reliance Foundation Scholarship",
    officialUrl:  "https://scholarships.reliancefoundation.org",
    amount:       200000,
    deadline:     "2026-01-31",
    status:       "upcoming",
    notes:        "1st year UG — 60%+ in Class 12, income ≤ ₹6 lakh. Opens Dec–Jan.",
  },
  "38": {
    officialName: "Aditya Birla Scholarship",
    officialUrl:  "https://www.adityabirlascholars.net",
    amount:       175000,
    deadline:     "2026-09-30",
    status:       "active",
    notes:        "Prestigious merit scholarship for IIT/IIM/BITS students",
  },
};

// ─── helpers ────────────────────────────────────────────────────────────────
function getPriority(field: string): "urgent" | "high" | "medium" | "low" {
  if (field === "deadline" || field === "status" || field === "deadline_passed") return "urgent";
  if (field === "amount")        return "high";
  if (field === "deadline_soon") return "high";
  if (field === "eligibility")   return "medium";
  return "low";
}

// ─── Analyse one scholarship against verified data ───────────────────────────
async function analyseScholarship(s: {
  id: string; title: string; amount: string; deadline: string;
  isActive: boolean; applyLink: string; eligibility: string;
}): Promise<number> {

  const verified = VERIFIED_DATA[s.id];
  const now      = new Date();
  let   changes  = 0;

  // ── 1. Deadline already passed but still marked active ───────────────────
  const storedDeadline = new Date(s.deadline);
  const daysLeft       = Math.ceil((storedDeadline.getTime() - now.getTime()) / 86400000);

  if (s.isActive && daysLeft < 0) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "deadline_passed", status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        verified?.officialUrl || s.applyLink || "#",
          field:            "deadline_passed",
          oldValue:         `Active (deadline: ${storedDeadline.toLocaleDateString("en-IN")})`,
          newValue:         `Expired ${Math.abs(daysLeft)} day(s) ago`,
          suggestedAction:  `Mark "${s.title}" as Inactive — deadline passed ${Math.abs(daysLeft)} day(s) ago`,
          priority:         "urgent",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // ── 2. Deadline expiring soon (≤ 7 days) ─────────────────────────────────
  if (s.isActive && daysLeft >= 0 && daysLeft <= 7) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "deadline_soon", newValue: `${daysLeft}`, status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        verified?.officialUrl || s.applyLink || "#",
          field:            "deadline_soon",
          oldValue:         "",
          newValue:         `${daysLeft}`,
          suggestedAction:  `Deadline in ${daysLeft} day(s) — send urgent reminder to students for "${s.title}"`,
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
    const suggestedUrl = verified?.officialUrl || "";
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "applyLink", status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        suggestedUrl || "#",
          field:            "applyLink",
          oldValue:         "Not set",
          newValue:         suggestedUrl || "Add official URL",
          suggestedAction:  suggestedUrl
            ? `Set apply link to: ${suggestedUrl}`
            : `Add an official apply link for "${s.title}"`,
          priority:         "medium",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // ── 4. Compare against verified database ─────────────────────────────────
  if (!verified) return changes; // no verified data for this scholarship

  // 4a. Amount mismatch
  const storedAmount   = parseInt(s.amount.replace(/[₹,\s]/g, ""), 10);
  const verifiedAmount = verified.amount;
  if (!isNaN(storedAmount) && storedAmount !== verifiedAmount) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "amount", newValue: String(verifiedAmount), status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        verified.officialUrl,
          field:            "amount",
          oldValue:         `₹${storedAmount.toLocaleString("en-IN")}`,
          newValue:         `₹${verifiedAmount.toLocaleString("en-IN")}`,
          suggestedAction:  `Update amount to ₹${verifiedAmount.toLocaleString("en-IN")} for "${s.title}" — verified from official source`,
          priority:         "high",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // 4b. Deadline mismatch (compare year only to avoid minor date drift)
  const verifiedDeadline = new Date(verified.deadline);
  const storedYear       = storedDeadline.getFullYear();
  const verifiedYear     = verifiedDeadline.getFullYear();
  const storedMonth      = storedDeadline.getMonth();
  const verifiedMonth    = verifiedDeadline.getMonth();

  if (storedYear !== verifiedYear || storedMonth !== verifiedMonth) {
    const storedStr   = storedDeadline.toLocaleDateString("en-IN",   { day: "numeric", month: "long", year: "numeric" });
    const verifiedStr = verifiedDeadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "deadline", newValue: verifiedStr, status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        verified.officialUrl,
          field:            "deadline",
          oldValue:         storedStr,
          newValue:         verifiedStr,
          suggestedAction:  `Update deadline to ${verifiedStr} for "${s.title}" — verified from official source`,
          priority:         "urgent",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // 4c. Status mismatch
  const storedStatus   = s.isActive ? "active" : "closed";
  const verifiedStatus = verified.status;
  if (storedStatus !== verifiedStatus) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "status", newValue: verifiedStatus, status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        verified.officialUrl,
          field:            "status",
          oldValue:         storedStatus,
          newValue:         verifiedStatus,
          suggestedAction:  `Mark "${s.title}" as "${verifiedStatus}" — ${verified.notes}`,
          priority:         "urgent",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // 4d. Apply link mismatch (if stored link differs from verified official URL)
  if (
    s.applyLink &&
    verified.officialUrl &&
    s.applyLink.trim() !== verified.officialUrl.trim() &&
    !s.applyLink.includes(new URL(verified.officialUrl).hostname)
  ) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "applyLink_mismatch", status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        verified.officialUrl,
          field:            "applyLink_mismatch",
          oldValue:         s.applyLink,
          newValue:         verified.officialUrl,
          suggestedAction:  `Update apply link to official URL: ${verified.officialUrl}`,
          priority:         "medium",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  return changes;
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
  for (const s of scholarships) {
    totalChanges += await analyseScholarship(s);
  }

  const msg = totalChanges === 0
    ? `✅ All ${scholarships.length} scholarships look good — no issues found.`
    : `⚠️ Scanned ${scholarships.length} scholarship(s). Found ${totalChanges} issue(s) — check alerts below.`;

  return NextResponse.json({ message: msg, checked: scholarships.length, changes: totalChanges });
}

// ─── GET — fetch all pending alerts ─────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  await connectDB();

  const alerts = await AdminAlert.find({ status: "pending" }).sort({ createdAt: -1 }).lean();

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
  await AdminAlert.findByIdAndUpdate(id, { status: action === "applied" ? "applied" : "dismissed" });
  return NextResponse.json({ ok: true });
}
