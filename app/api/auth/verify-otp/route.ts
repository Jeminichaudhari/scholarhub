import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  if (!email || !otp)
    return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 });

  await connectDB();

  const record = await Otp.findOne({ email });

  if (!record)
    return NextResponse.json({ message: "OTP not found. Please request a new one." }, { status: 400 });

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ email });
    return NextResponse.json({ message: "OTP has expired. Please request a new one." }, { status: 400 });
  }

  if (record.otp !== otp)
    return NextResponse.json({ message: "Invalid OTP. Please try again." }, { status: 400 });

  // OTP is correct — delete it so it can't be reused
  await Otp.deleteOne({ email });

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, name: email.split("@")[0], role: "student" });
  }

  return NextResponse.json({
    message: "OTP verified",
    user: { id: user._id.toString(), email: user.email, role: user.role },
  });
}
