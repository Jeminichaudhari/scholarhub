import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { createMailer, FROM } from "@/lib/mailer";
import mongoose, { Schema } from "mongoose";

// Reuse StudentNotif model
const StudentNotif = mongoose.models.StudentNotif ||
  mongoose.model("StudentNotif", new Schema({
    studentEmail: { type: String, required: true },
    title:        { type: String, required: true },
    message:      { type: String, required: true },
    type:         { type: String, default: "info" },
    read:         { type: Boolean, default: false },
  }, { timestamps: true }));

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { title, description, eligibility, amount, deadline, category, applyLink } = await req.json();
  if (!title) return NextResponse.json({ message: "Title required" }, { status: 400 });

  try {
    await connectDB();

    const students = await User.find({ role: "student" }, { email: 1, name: 1 });
    if (students.length === 0)
      return NextResponse.json({ message: "No students found", sent: 0 });

    const transporter = createMailer();
    await transporter.verify();

    const deadlineStr = deadline
      ? new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : "Not specified";

    // Detect if this is an update notification
    const isUpdate  = title.startsWith("[Updated]");
    const cleanTitle = isUpdate ? title.replace("[Updated] ", "") : title;
    const subject    = isUpdate
      ? `✏️ Scholarship Updated — ${cleanTitle}`
      : `🎓 New Scholarship Added — ${cleanTitle}`;

    let sent = 0;
    const errors: string[] = [];

    for (const student of students) {
      try {
        await transporter.sendMail({
          from: FROM(),
          to:   student.email,
          subject,
          html: notificationEmail({
            studentName: student.name || "Student",
            title:       cleanTitle,
            isUpdate,
            description: description  || "",
            eligibility: eligibility  || "",
            amount:      amount       || "",
            deadline:    deadlineStr,
            category:    category     || "General",
            applyLink:   applyLink    || "",
          }),
        });
        sent++;
      } catch (err: any) {
        errors.push(`${student.email}: ${err?.message}`);
      }
    }

    // Save in-app notifications for all students
    try {
      const notifDocs = students.map(s => ({
        studentEmail: s.email,
        title:        cleanTitle,
        message:      description || `${isUpdate ? "Updated" : "New"} scholarship: ${cleanTitle}. Deadline: ${deadlineStr}.`,
        type:         isUpdate ? "warning" : "success",
        read:         false,
      }));
      await StudentNotif.insertMany(notifDocs);
    } catch (err) {
      console.error("In-app notif save error:", err);
    }

    return NextResponse.json({ message: "Notifications sent", sent, total: students.length, errors });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "Server error" }, { status: 500 });
  }
}

function notificationEmail({ studentName, title, isUpdate, description, eligibility, amount, deadline, category, applyLink }: {
  studentName: string; title: string; isUpdate: boolean;
  description: string; eligibility: string; amount: string;
  deadline: string; category: string; applyLink: string;
}) {
  const badge = isUpdate ? "✏️ Scholarship Updated" : "🎓 New Scholarship Added";
  const intro = isUpdate
    ? `A scholarship has been <b>updated</b> on ScholarHub. Check the latest details below.`
    : `A <b>new scholarship</b> has been added on ScholarHub!`;

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#1a2744,#1e3a6e);padding:28px 24px">
        <p style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">ScholarHub · ${badge}</p>
        <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 6px">${title}</h1>
        <span style="background:rgba(255,255,255,0.15);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${category}</span>
      </div>
      <div style="padding:24px;background:#fff">
        <p style="color:#374151;font-size:15px;margin:0 0 20px">Hi <b>${studentName}</b>, ${intro}</p>

        ${description ? `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 16px;margin-bottom:14px">
          <p style="color:#1e40af;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 4px">About</p>
          <p style="color:#1e3a8a;font-size:14px;margin:0">${description}</p>
        </div>` : ""}

        <div style="display:flex;gap:10px;margin-bottom:16px">
          ${amount ? `
          <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px">
            <p style="color:#166534;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 2px">Amount</p>
            <p style="color:#14532d;font-size:16px;font-weight:800;margin:0">₹${amount}</p>
          </div>` : ""}
          <div style="flex:1;background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:12px">
            <p style="color:#92400e;font-size:10px;font-weight:700;text-transform:uppercase;margin:0 0 2px">Deadline</p>
            <p style="color:#78350f;font-size:14px;font-weight:800;margin:0">${deadline}</p>
          </div>
        </div>

        ${eligibility ? `
        <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:14px 16px;margin-bottom:16px">
          <p style="color:#6b21a8;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 4px">Eligibility</p>
          <p style="color:#581c87;font-size:14px;margin:0">${eligibility}</p>
        </div>` : ""}

        ${applyLink ? `
        <a href="${applyLink}" style="display:block;background:linear-gradient(135deg,#1e6fff,#2563eb);color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;margin-bottom:12px">
          Apply Now on Official Site →
        </a>` : ""}

        <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;text-align:center">
          Login to <a href="http://localhost:3000/student" style="color:#3b82f6">ScholarHub</a> to view all scholarships.
        </p>
      </div>
    </div>
  `;
}
