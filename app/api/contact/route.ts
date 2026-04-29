export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createMailer, FROM } from "@/lib/mailer";
import connectDB from "@/lib/mongodb";
import Contact from "@/models/Contact";

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json();

  if (!name || !email || !subject || !message)
    return NextResponse.json({ message: "All fields required" }, { status: 400 });

  // Save to MongoDB
  try {
    await connectDB();
    await Contact.create({ name, email, subject, message });
  } catch (err) {
    console.error("Contact save error:", err);
  }

  // Send email to admin
  try {
    const transporter = createMailer();
    await transporter.verify();
    await transporter.sendMail({
      from: FROM(),
      to:   process.env.EMAIL_USER,
      replyTo: email,
      subject: `[ScholarHub Contact] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
          <div style="background:linear-gradient(135deg,#1a2744,#1e3a6e);padding:24px">
            <p style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">ScholarHub Â· Student Contact</p>
            <h1 style="color:#fff;font-size:18px;font-weight:800;margin:0">${subject}</h1>
          </div>
          <div style="padding:24px;background:#fff">
            <div style="background:#f8fafc;border-radius:12px;padding:14px 16px;margin-bottom:16px;border:1px solid #e2e8f0">
              <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase">From</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a">${name}</p>
              <p style="margin:2px 0 0;font-size:13px;color:#3b82f6">${email}</p>
            </div>
            <div style="background:#eff6ff;border-radius:12px;padding:14px 16px;border:1px solid #bfdbfe">
              <p style="margin:0 0 8px;font-size:12px;color:#1d4ed8;font-weight:600;text-transform:uppercase">Message</p>
              <p style="margin:0;font-size:14px;color:#1e3a8a;line-height:1.6;white-space:pre-wrap">${message}</p>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;text-align:center">Reply directly to this email to respond to the student.</p>
          </div>
        </div>
      `,
    });
  } catch (err: any) {
    console.error("Email send error:", err?.message);
    // Still return success since message was saved to DB
  }

  return NextResponse.json({ message: "Message sent successfully" });
}

export async function GET() {
  try {
    await connectDB();
    const messages = await Contact.find().sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  try {
    await connectDB();
    await Contact.findByIdAndUpdate(id, { read: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    await connectDB();
    await Contact.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

