export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import AdminAlert from "@/models/AdminAlert";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin")
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });

  await connectDB();

  const alerts = await AdminAlert.find({ status: { $in: ["dismissed", "applied"] } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ alerts });
}
