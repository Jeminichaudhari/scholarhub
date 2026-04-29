export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";
import User from "@/models/User";

// GET - Saari scholarships fetch karo
export async function GET() {
  await connectDB();
  const scholarships = await Scholarship.find({ isActive: true }).sort({
    deadline: 1,
  });
  return NextResponse.json({ scholarships });
}

// POST - Admin scholarship banaye
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Sirf admin kar sakta hai" }, { status: 403 });
  }

  const body = await req.json();
  await connectDB();

  const scholarship = await Scholarship.create({
    ...body,
    createdBy: (session.user as { id?: string }).id,
  });

  return NextResponse.json({ message: "Scholarship add ho gayi!", scholarship }, { status: 201 });
}

// PATCH - Student scholarship ke liye apply kare
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Login karo pehle" }, { status: 401 });
  }

  const { scholarshipId } = await req.json();
  await connectDB();

  const user = await User.findOne({ email: session.user.email });
  const scholarship = await Scholarship.findById(scholarshipId);

  if (!scholarship) {
    return NextResponse.json({ error: "Scholarship nahi mili" }, { status: 404 });
  }

  if (user.appliedScholarships.includes(scholarshipId)) {
    return NextResponse.json({ error: "Pehle se apply kar chuke ho" }, { status: 400 });
  }

  await User.findByIdAndUpdate(user._id, {
    $push: { appliedScholarships: scholarshipId },
  });
  await Scholarship.findByIdAndUpdate(scholarshipId, {
    $push: { applicants: user._id },
  });

  return NextResponse.json({ message: "Apply ho gaya! ðŸŽ‰" });
}
