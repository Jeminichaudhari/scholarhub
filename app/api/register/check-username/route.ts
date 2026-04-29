import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("username") || "";
  const username = raw.toLowerCase();

  // Validate format first
  if (username.length < 3 || username.length > 20) return NextResponse.json({ available: false });
  if (!/^[a-z]/.test(username)) return NextResponse.json({ available: false });
  if (!/^[a-z0-9_]+$/.test(username)) return NextResponse.json({ available: false });
  if (/_{2,}/.test(username)) return NextResponse.json({ available: false });

  await connectDB();
  const exists = await User.findOne({ username });
  return NextResponse.json({ available: !exists });
}
