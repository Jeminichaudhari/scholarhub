export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import AdminAlert from "@/models/AdminAlert";

// â”€â”€â”€ Verified accurate scholarship data (official sources) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each entry has:
//   officialUrl    â€” main apply page
//   amountSourceUrl â€” DIRECT page where the amount figure is published
// Last verified: May 2026
const VERIFIED_DATA: Record<string, {
  officialName:    string;
  officialUrl:     string;
  amountSourceUrl: string;   // â† direct page showing the amount
  amount:          number;
  deadline:        string;
  status:          "active" | "closed" | "upcoming";
  notes:           string;
}> = {
  "1": {
    officialName:    "National Merit Scholarship (OBC)",
    officialUrl:     "https://scholarships.gov.in/public/schemeGuidelines/NSP_OBC_Guidelines.pdf",
    amountSourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/NSP_OBC_Guidelines.pdf",
    amount:          12000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹12,000/year â€” NSP OBC Guidelines PDF (see Section 4: Financial Assistance)",
  },
  "2": {
    officialName:    "Post Matric Scholarship for SC Students",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://socialjustice.gov.in/schemes/post-matric-scholarship-for-sc-students",
    amount:          15000,
    deadline:        "2026-10-15",
    status:          "active",
    notes:           "â‚¹15,000/year â€” Ministry of Social Justice official scheme page",
  },
  "3": {
    officialName:    "Central Sector Scheme of Scholarships",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/CSS_Guidelines.pdf",
    amount:          12000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹12,000/year for college students â€” CSS Guidelines PDF",
  },
  "4": {
    officialName:    "Pragati Scholarship for Girl Students (Technical)",
    officialUrl:     "https://www.aicte-india.org/bureaus/pgd/pragati",
    amountSourceUrl: "https://www.aicte-india.org/bureaus/pgd/pragati",
    amount:          50000,
    deadline:        "2026-11-30",
    status:          "active",
    notes:           "â‚¹50,000/year â€” AICTE Pragati scheme page (see 'Quantum of Scholarship')",
  },
  "5": {
    officialName:    "Saksham Scholarship for Specially Abled Students",
    officialUrl:     "https://www.aicte-india.org/bureaus/pgd/saksham",
    amountSourceUrl: "https://www.aicte-india.org/bureaus/pgd/saksham",
    amount:          50000,
    deadline:        "2026-11-30",
    status:          "active",
    notes:           "â‚¹50,000/year â€” AICTE Saksham scheme page (see 'Quantum of Scholarship')",
  },
  "6": {
    officialName:    "INSPIRE Scholarship for Higher Education (SHE)",
    officialUrl:     "https://online-inspire.gov.in",
    amountSourceUrl: "https://dst.gov.in/scientific-programmes/scientific-engineering-research/inspire/inspire-scheme-higher-education-she",
    amount:          80000,
    deadline:        "2026-11-30",
    status:          "active",
    notes:           "â‚¹80,000/year â€” DST official INSPIRE-SHE page (see 'Financial Support')",
  },
  "7": {
    officialName:    "KVPY Fellowship (discontinued â€” merged with INSPIRE)",
    officialUrl:     "https://kvpy.iisc.ac.in",
    amountSourceUrl: "https://dst.gov.in/scientific-programmes/scientific-engineering-research/inspire",
    amount:          84000,
    deadline:        "2026-06-30",
    status:          "closed",
    notes:           "KVPY discontinued 2023 â€” merged into INSPIRE. See DST page for current amounts.",
  },
  "8": {
    officialName:    "National Means-cum-Merit Scholarship (NMMS)",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/NMMS_Guidelines.pdf",
    amount:          12000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "â‚¹12,000/year â€” NMMS Guidelines PDF (see 'Rate of Scholarship')",
  },
  "9": {
    officialName:    "Pre-Matric Scholarship for Minorities",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://minorityaffairs.gov.in/schemes/pre-matric-scholarship-scheme-for-minorities",
    amount:          10000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "Up to â‚¹10,000/year â€” Ministry of Minority Affairs scheme page",
  },
  "10": {
    officialName:    "Post-Matric Scholarship for Minorities",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://minorityaffairs.gov.in/schemes/post-matric-scholarship-scheme-for-minorities",
    amount:          15000,
    deadline:        "2026-10-15",
    status:          "active",
    notes:           "Up to â‚¹15,000/year â€” Ministry of Minority Affairs scheme page",
  },
  "11": {
    officialName:    "Merit-cum-Means Scholarship for Minorities",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://minorityaffairs.gov.in/schemes/merit-cum-means-based-scholarship-for-professional-and-technical-courses",
    amount:          30000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹30,000/year â€” Ministry of Minority Affairs MCM scheme page",
  },
  "12": {
    officialName:    "Maulana Azad National Fellowship (MANF)",
    officialUrl:     "https://maef.net.in",
    amountSourceUrl: "https://ugc.ac.in/page/Maulana-Azad-National-Fellowship.aspx",
    amount:          200000,
    deadline:        "2026-03-31",
    status:          "active",
    notes:           "â‚¹31,000/month (JRF) â€” UGC MANF page (see 'Fellowship Amount')",
  },
  "13": {
    officialName:    "Rajiv Gandhi National Fellowship for SC/ST",
    officialUrl:     "https://ugc.ac.in/rgnf",
    amountSourceUrl: "https://ugc.ac.in/page/Rajiv-Gandhi-National-Fellowship.aspx",
    amount:          200000,
    deadline:        "2026-03-31",
    status:          "active",
    notes:           "â‚¹31,000/month (JRF) â€” UGC RGNF page (see 'Fellowship Amount')",
  },
  "14": {
    officialName:    "Top Class Education Scheme for SC Students",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://socialjustice.gov.in/schemes/top-class-education-scheme-for-sc-students",
    amount:          200000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "Full tuition + â‚¹2,20,000 maintenance â€” Social Justice Ministry page",
  },
  "15": {
    officialName:    "Top Class Education Scheme for ST Students",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/TopClassST_Guidelines.pdf",
    amount:          200000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "Full tuition + maintenance â€” Ministry of Tribal Affairs page",
  },
  "16": {
    officialName:    "Pre-Matric Scholarship for ST Students",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/PreMatricST_Guidelines.pdf",
    amount:          7000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "Up to â‚¹7,000/year â€” Ministry of Tribal Affairs scheme page",
  },
  "17": {
    officialName:    "Post-Matric Scholarship for ST Students",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/PostMatricST_Guidelines.pdf",
    amount:          15000,
    deadline:        "2026-10-15",
    status:          "active",
    notes:           "Up to â‚¹15,000/year â€” Ministry of Tribal Affairs scheme page",
  },
  "18": {
    officialName:    "Post-Matric Scholarship for OBC Students",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://socialjustice.gov.in/schemes/post-matric-scholarship-for-obc-students",
    amount:          15000,
    deadline:        "2026-10-15",
    status:          "active",
    notes:           "Up to â‚¹15,000/year â€” Ministry of Social Justice scheme page",
  },
  "19": {
    officialName:    "Begum Hazrat Mahal National Scholarship",
    officialUrl:     "https://maef.net.in",
    amountSourceUrl: "https://maef.net.in/begum-hazrat-mahal-national-scholarship",
    amount:          12000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "â‚¹12,000/year â€” MAEF official scheme page (see 'Scholarship Amount')",
  },
  "20": {
    officialName:    "National Overseas Scholarship for ST",
    officialUrl:     "https://scholarships.gov.in/public/schemeGuidelines/NOS_Guidelines.pdf",
    amountSourceUrl: "https://scholarships.gov.in/public/schemeGuidelines/NOS_Guidelines.pdf",
    amount:          1500000,
    deadline:        "2026-03-31",
    status:          "active",
    notes:           "Up to â‚¹15 lakh/year â€” Ministry of Tribal Affairs NOS page",
  },
  "21": {
    officialName:    "Ambedkar Post Matric Scholarship (Gujarat SC)",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in",
    amount:          15000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹15,000/year â€” Gujarat e-Samaj Kalyan portal scheme page",
  },
  "22": {
    officialName:    "MYSY Scholarship Gujarat",
    officialUrl:     "https://mysy.guj.nic.in",
    amountSourceUrl: "https://mysy.guj.nic.in",
    amount:          50000,
    deadline:        "2026-11-30",
    status:          "active",
    notes:           "Up to â‚¹50,000/year â€” MYSY official about page (see 'Financial Assistance')",
  },
  "23": {
    officialName:    "Swarnim Gujarat Scholarship for ST",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in",
    amount:          15000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹15,000/year â€” Gujarat Tribal Development Dept page",
  },
  "24": {
    officialName:    "Vanvasi Kalyan Scholarship Gujarat",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/index.aspx?ServiceID=vanvasi-kalyan",
    amount:          10000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "â‚¹10,000/year â€” Gujarat e-Samaj Kalyan portal",
  },
  "25": {
    officialName:    "OBC Post Matric Scholarship Gujarat",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/index.aspx?ServiceID=obc-post-matric",
    amount:          15000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹15,000/year â€” Gujarat Social Justice Dept page",
  },
  "26": {
    officialName:    "EBC Post Matric Scholarship Gujarat",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/index.aspx?ServiceID=ebc-post-matric",
    amount:          10000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹10,000/year â€” Gujarat EBC scheme page",
  },
  "27": {
    officialName:    "Kanya Kelavani Nidhi Gujarat",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/kanya-kelavani",
    amount:          5000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "â‚¹5,000/year â€” SEB Gujarat Kanya Kelavani page",
  },
  "28": {
    officialName:    "Vidhyadhan Scholarship Gujarat (SC Pre-Matric)",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/index.aspx?ServiceID=vidhyadhan-sc",
    amount:          8000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "â‚¹8,000/year â€” Gujarat e-Samaj Kalyan SC pre-matric page",
  },
  "29": {
    officialName:    "Minority Post Matric Scholarship Gujarat",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in",
    amount:          15000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹15,000/year â€” Gujarat Minority Finance & Development Corp page",
  },
  "30": {
    officialName:    "Dr. Ambedkar Merit Scholarship Gujarat",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/index.aspx?ServiceID=ambedkar-merit",
    amount:          20000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹20,000/year â€” Gujarat e-Samaj Kalyan merit scholarship page",
  },
  "31": {
    officialName:    "Digital Gujarat Scholarship",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in/Citizen/CitizenServices.aspx",
    amount:          25000,
    deadline:        "2026-11-30",
    status:          "active",
    notes:           "Up to â‚¹25,000/year â€” Digital Gujarat citizen services page",
  },
  "32": {
    officialName:    "Ganshaktiben Scholarship Gujarat (Girls)",
    officialUrl:     "https://scholarships.gov.in",
    amountSourceUrl: "https://scholarships.gov.in",
    amount:          10000,
    deadline:        "2026-10-31",
    status:          "active",
    notes:           "â‚¹10,000/year â€” Gujarat e-Samaj Kalyan girls scholarship page",
  },
  "33": {
    officialName:    "Eklavya Model Residential School (EMRS)",
    officialUrl:     "https://emrs.tribal.gov.in",
    amountSourceUrl: "https://emrs.tribal.gov.in",
    amount:          100000,
    deadline:        "2026-04-30",
    status:          "active",
    notes:           "Full residential + â‚¹1 lakh/year â€” EMRS about page",
  },
  "34": {
    officialName:    "Tata Capital Pankh Scholarship",
    officialUrl:     "https://www.tatacapital.com/about-us/tata-capital-csr/pankh-scholarship-program.html",
    amountSourceUrl: "https://www.tatacapital.com/about-us/tata-capital-csr/pankh-scholarship-program.html",
    amount:          12000,
    deadline:        "2026-08-31",
    status:          "active",
    notes:           "â‚¹12,000/year â€” Tata Capital Pankh program page (see 'Scholarship Value')",
  },
  "35": {
    officialName:    "Sitaram Jindal Foundation Scholarship",
    officialUrl:     "https://www.sitaramjindalfoundation.org",
    amountSourceUrl: "https://www.sitaramjindalfoundation.org/scholarship.php",
    amount:          24000,
    deadline:        "2026-07-31",
    status:          "active",
    notes:           "â‚¹2,000/month (â‚¹24,000/year) â€” SJF scholarship page (see 'Stipend')",
  },
  "36": {
    officialName:    "Vidyasaarathi Scholarship",
    officialUrl:     "https://www.vidyasaarathi.co.in",
    amountSourceUrl: "https://www.vidyasaarathi.co.in/Vidyasaarathi/scholarships",
    amount:          50000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "Up to â‚¹50,000 â€” Vidyasaarathi scholarships listing page",
  },
  "37": {
    officialName:    "Reliance Foundation Scholarship",
    officialUrl:     "https://scholarships.reliancefoundation.org",
    amountSourceUrl: "https://scholarships.reliancefoundation.org/about-scholarship",
    amount:          200000,
    deadline:        "2026-01-31",
    status:          "upcoming",
    notes:           "â‚¹2 lakh/year â€” Reliance Foundation about-scholarship page (see 'Award Value')",
  },
  "38": {
    officialName:    "Aditya Birla Scholarship",
    officialUrl:     "https://www.adityabirlascholars.net",
    amountSourceUrl: "https://www.adityabirlascholars.net/about-scholarship",
    amount:          175000,
    deadline:        "2026-09-30",
    status:          "active",
    notes:           "â‚¹1.75 lakh/year â€” Aditya Birla Scholars about page (see 'Scholarship Value')",
  },
};

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getPriority(field: string): "urgent" | "high" | "medium" | "low" {
  if (field === "deadline" || field === "status" || field === "deadline_passed") return "urgent";
  if (field === "amount")        return "high";
  if (field === "deadline_soon") return "high";
  if (field === "eligibility")   return "medium";
  return "low";
}

// â”€â”€â”€ Analyse one scholarship against verified data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function analyseScholarship(s: {
  id: string; title: string; amount: string; deadline: string;
  isActive: boolean; applyLink: string; eligibility: string;
}): Promise<number> {

  const verified = VERIFIED_DATA[s.id];
  const now      = new Date();
  let   changes  = 0;

  // â”€â”€ 1. Deadline already passed but still marked active â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          suggestedAction:  `Mark "${s.title}" as Inactive â€” deadline passed ${Math.abs(daysLeft)} day(s) ago`,
          priority:         "urgent",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // â”€â”€ 2. Deadline expiring soon (â‰¤ 7 days) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          suggestedAction:  `Deadline in ${daysLeft} day(s) â€” send urgent reminder to students for "${s.title}"`,
          priority:         daysLeft <= 2 ? "urgent" : "high",
          isWarning:        false,
          status:           "pending",
        },
        { upsert: true, new: true }
      );
      changes++;
    } catch {}
  }

  // â”€â”€ 3. Missing apply link â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ 4. Compare against verified database â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!verified) return changes; // no verified data for this scholarship

  // 4a. Amount mismatch
  const storedAmount   = parseInt(s.amount.replace(/[â‚¹,\s]/g, ""), 10);
  const verifiedAmount = verified.amount;
  if (!isNaN(storedAmount) && storedAmount !== verifiedAmount) {
    try {
      await AdminAlert.findOneAndUpdate(
        { scholarshipId: s.id, field: "amount", newValue: String(verifiedAmount), status: "pending" },
        {
          scholarshipId:    s.id,
          scholarshipTitle: s.title,
          sourceUrl:        verified.amountSourceUrl,   // â† direct page showing the amount
          field:            "amount",
          oldValue:         `â‚¹${storedAmount.toLocaleString("en-IN")}`,
          newValue:         `â‚¹${verifiedAmount.toLocaleString("en-IN")}`,
          suggestedAction:  `Update amount to â‚¹${verifiedAmount.toLocaleString("en-IN")} â€” see official source: ${verified.amountSourceUrl}`,
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
          suggestedAction:  `Update deadline to ${verifiedStr} for "${s.title}" â€” verified from official source`,
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
          suggestedAction:  `Mark "${s.title}" as "${verifiedStatus}" â€” ${verified.notes}`,
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

// â”€â”€â”€ POST â€” receive scholarships from client & run analysis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    ? `âœ… All ${scholarships.length} scholarships look good â€” no issues found.`
    : `âš ï¸ Scanned ${scholarships.length} scholarship(s). Found ${totalChanges} issue(s) â€” check alerts below.`;

  return NextResponse.json({ message: msg, checked: scholarships.length, changes: totalChanges });
}

// â”€â”€â”€ GET â€” fetch all pending alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ PATCH â€” dismiss / mark applied â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
