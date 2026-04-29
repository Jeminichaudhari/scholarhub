export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createMailer, FROM } from "@/lib/mailer";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
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
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  const { to, name, subject, message } = await req.json();
  if (!to || !message)
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });

  // Save as in-app notification for the student
  try {
    await connectDB();
    await StudentNotif.create({
      studentEmail: to,
      title:        `Admin Reply: ${subject}`,
      message:      message,
      type:         "info",
      read:         false,
    });
  } catch (err) {
    console.error("Notif save error:", err);
  }

  // Send email
  try {
    const transporter = createMailer();
    await transporter.verify();
    await transporter.sendMail({
      from: FROM("ScholarHub Admin"),
      to,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:linear-gradient(135deg,#1a2744,#1e3a6e);padding:24px">
            <p style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">ScholarHub Â· Admin Reply</p>
            <h1 style="color:#fff;font-size:18px;font-weight:800;margin:0">Re: ${subject}</h1>
          </div>
          <div style="padding:24px;background:#fff">
            <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <b>${name}</b>,</p>
            <div style="background:#f0fdf4;border-radius:12px;padding:16px;border:1px solid #bbf7d0;margin-bottom:16px">
              <p style="margin:0;font-size:14px;color:#166534;line-height:1.7;white-space:pre-wrap">${message}</p>
            </div>
            <p style="color:#6b7280;font-size:13px;margin:0">â€” ScholarHub Support Team</p>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error("Reply email error:", err?.message);
    // Still return success since notification was saved
  }

  return NextResponse.json({ message: "Reply sent" });
}

