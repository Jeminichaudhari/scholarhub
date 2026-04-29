export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Reminder from "@/models/Reminder";

// POST â€” set/update a reminder
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const {
    scholarshipId, scholarshipTitle, deadline, applyLink,
    reminderDays, reminderHour, reminderMinute,
    // New: array of { date, hour, minute }
    reminderDates,
  } = await req.json();

  if (!scholarshipId || !deadline)
    return NextResponse.json({ message: "Missing fields" }, { status: 400 });

  await connectDB();

  // Build reminderDates array â€” prefer new format, fall back to legacy
  let rdates: { date: string; hour: number; minute: number; sent: boolean }[] = [];

  if (Array.isArray(reminderDates) && reminderDates.length > 0) {
    // New format: [{ date: "2026-04-16", hour: 9, minute: 0 }, ...]
    rdates = reminderDates.map((r: any) => ({
      date:   r.date,
      hour:   typeof r.hour === "number" ? r.hour : (reminderHour ?? 9),
      minute: typeof r.minute === "number" ? r.minute : (reminderMinute ?? 0),
      sent:   false,
    }));
  } else if (Array.isArray(reminderDays) && reminderDays.length > 0) {
    // Legacy: days before deadline
    const dl = new Date(deadline);
    rdates = reminderDays.map((d: number) => {
      const dt = new Date(dl);
      dt.setDate(dt.getDate() - d);
      return {
        date:   dt.toISOString().split("T")[0],
        hour:   reminderHour ?? 9,
        minute: reminderMinute ?? 0,
        sent:   false,
      };
    });
  }

  await Reminder.findOneAndUpdate(
    { studentEmail: session.user.email, scholarshipId },
    {
      studentEmail:     session.user.email,
      studentName:      session.user.name || "Student",
      scholarshipId,
      scholarshipTitle,
      applyLink:        applyLink || "",
      deadline:         new Date(deadline),
      reminderDates:    rdates,
      // Keep legacy fields too
      reminderDays:     reminderDays || [],
      sentDays:         [],
      reminderHour:     reminderHour ?? 9,
      reminderMinute:   reminderMinute ?? 0,
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ message: "Reminder set!", count: rdates.length });
}

// DELETE â€” remove a reminder
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { scholarshipId } = await req.json();
  await connectDB();
  await Reminder.deleteOne({ studentEmail: session.user.email, scholarshipId });
  return NextResponse.json({ message: "Reminder removed" });
}

// GET â€” get all reminders for current student
export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ reminders: [] });

  await connectDB();
  const reminders = await Reminder.find({ studentEmail: session.user.email });
  return NextResponse.json({ reminders });
}

