export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createMailer, FROM } from "@/lib/mailer";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// â”€â”€ POST /api/auth/reset-password
// action: "send-otp"   â†’ verify admin email exists, send OTP
// action: "verify-otp" â†’ verify OTP, return token to allow reset
// action: "reset"      â†’ verify OTP token + save new password
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  await connectDB();

  // â”€â”€ 1. Send reset OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === "send-otp") {
    const { email } = body;
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ message: "No account found with this email" }, { status: 404 });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"ScholarHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - ScholarHub Admin",
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:28px;border:1px solid #e5e7eb;border-radius:16px">
          <h2 style="color:#7c3aed">Password Reset</h2>
          <p style="color:#374151">Use this OTP to reset your admin password:</p>
          <div style="background:#f5f3ff;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#7c3aed">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:13px">Expires in <b>5 minutes</b>. Do not share this with anyone.</p>
        </div>
      `,
    });

    const [name, domain] = email.split("@");
    const maskedEmail = name[0] + "***@" + domain;
    return NextResponse.json({ message: "OTP sent", maskedEmail });
  }

  // â”€â”€ 2. Verify OTP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === "verify-otp") {
    const { email, otp } = body;
    if (!email || !otp) return NextResponse.json({ message: "Email and OTP required" }, { status: 400 });

    const record = await Otp.findOne({ email });
    if (!record) return NextResponse.json({ message: "OTP not found. Request a new one." }, { status: 400 });
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return NextResponse.json({ message: "OTP expired. Request a new one." }, { status: 400 });
    }
    if (record.otp !== otp) return NextResponse.json({ message: "Invalid OTP." }, { status: 400 });

    // Don't delete OTP yet â€” keep it as a "verified" token for the reset step
    return NextResponse.json({ message: "OTP verified", verified: true });
  }

  // â”€â”€ 3. Reset password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (action === "reset") {
    const { email, otp, newPassword } = body;
    if (!email || !otp || !newPassword)
      return NextResponse.json({ message: "All fields required" }, { status: 400 });
    if (newPassword.length < 6)
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });

    // Re-verify OTP one final time before saving
    const record = await Otp.findOne({ email });
    if (!record || record.otp !== otp || record.expiresAt < new Date())
      return NextResponse.json({ message: "OTP expired or invalid. Start over." }, { status: 400 });

    await Otp.deleteOne({ email });

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ email }, { password: hashed });

    return NextResponse.json({ message: "Password reset successful" });
  }

  return NextResponse.json({ message: "Invalid action" }, { status: 400 });
}

