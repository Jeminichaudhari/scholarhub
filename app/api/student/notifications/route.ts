export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import mongoose, { Schema, Document } from "mongoose";

// Inline model to avoid circular imports
interface IStudentNotif extends Document {
  studentEmail: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "urgent";
  read: boolean;
  createdAt: Date;
}

const StudentNotifSchema = new Schema<IStudentNotif>(
  {
    studentEmail: { type: String, required: true },
    title:        { type: String, required: true },
    message:      { type: String, required: true },
    type:         { type: String, enum: ["info","success","warning","urgent"], default: "info" },
    read:         { type: Boolean, default: false },
  },
  { timestamps: true }
);

const StudentNotif = mongoose.models.StudentNotif ||
  mongoose.model<IStudentNotif>("StudentNotif", StudentNotifSchema);

// GET â€” fetch notifications for logged-in student
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

// PATCH â€” mark one or all as read
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

// DELETE â€” delete a notification
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await req.json();
  await connectDB();
  await StudentNotif.findOneAndDelete({ _id: id, studentEmail: session.user.email });
  return NextResponse.json({ ok: true });
}

