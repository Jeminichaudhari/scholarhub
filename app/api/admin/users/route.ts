export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  await connectDB();
  const allUsers = await User.find({ role: "student" }, { name: 1, email: 1, createdAt: 1 }).sort({ createdAt: -1 });

  // Remove duplicates by email â€” keep the most recent registration
  const seen = new Set<string>();
  const users = allUsers.filter(u => {
    if (seen.has(u.email)) return false;
    seen.add(u.email);
    return true;
  });

  return NextResponse.json({ users });
}

