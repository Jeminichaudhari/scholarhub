export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import { createMailer, FROM } from "@/lib/mailer";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });

    await connectDB();

    // Step 1: Verify password
    const user = await User.findOne({ email });
    if (!user || !user.password)
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });

    // Step 2: Generate OTP and save
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    // Step 3: Send email
    try {
      const transporter = createMailer();
      // Verify connection before sending
      await transporter.verify();
      await transporter.sendMail({
        from: FROM(),
        to: email,
        subject: "Your Login OTP - ScholarHub",
        html: `
          <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:28px;border:1px solid #e5e7eb;border-radius:16px">
            <h2 style="color:#1d4ed8;margin-bottom:4px">ScholarHub</h2>
            <p style="color:#374151;margin-bottom:20px">Your 2-step verification code:</p>
            <div style="background:#eff6ff;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px">
              <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#1d4ed8">${otp}</span>
            </div>
            <p style="color:#6b7280;font-size:13px">This OTP expires in <b>5 minutes</b>. Do not share it with anyone.</p>
          </div>
        `,
      });
    } catch (emailErr: any) {
      console.error("âŒ Email send failed:", emailErr?.message);
      console.error("âŒ Full error:", JSON.stringify(emailErr, null, 2));
      console.log(`\nðŸ”‘ DEV MODE â€” OTP for ${email}: ${otp}\n`);
      // Return error to client so user knows email failed
      return NextResponse.json({
        message: `OTP generated but email failed: ${emailErr?.message}. Check terminal for OTP.`,
        maskedEmail: email[0] + "***@" + email.split("@")[1],
        emailFailed: true,
      });
    }

    const [name, domain] = email.split("@");
    const maskedEmail = name[0] + "***@" + domain;
    return NextResponse.json({ message: "OTP sent", maskedEmail });

  } catch (err: any) {
    console.error("send-otp error:", err);
    return NextResponse.json({ message: err?.message || "Server error" }, { status: 500 });
  }
}

