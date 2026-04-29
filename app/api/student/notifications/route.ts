export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import StudentNotif from "@/models/StudentNotif";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ notifications: [] });

  await connectDB();
  const notifications = await StudentNotif
    .find({ studentEmail: session.user.email })
    .sort({ createdAt: -1 })
    .limit(20);

  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  const { id, all } = await req.json();
  await connectDB();

  if (all) {
    await StudentNotif.updateMany({ studentEmail: session.user.email }, { read: true });
  } else if (id) {
    await StudentNotif.findByIdAndUpdate(id, { read: true });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await req.json();
  await connectDB();
  await StudentNotif.findOneAndDelete({ _id: id, studentEmail: session.user.email });
  return NextResponse.json({ ok: true });
}
