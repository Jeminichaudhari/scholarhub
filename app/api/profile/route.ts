export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// GET - Profile fetch karo
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Login karo pehle" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).select(
    "-password"
  );

  return NextResponse.json({ user });
}

// PUT - Profile update karo
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Login karo pehle" }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = [
    "name", "phone", "address", "dateOfBirth",
    "gender", "category", "income", "aadharNumber",
    "bankAccount", "ifscCode",
  ];

  const updateData: Record<string, unknown> = {};
  allowedFields.forEach((field) => {
    if (body[field] !== undefined) updateData[field] = body[field];
  });

  await connectDB();
  const user = await User.findOneAndUpdate(
    { email: session.user.email },
    updateData,
    { new: true }
  ).select("-password");

  return NextResponse.json({ message: "Profile update ho gaya!", user });
}
