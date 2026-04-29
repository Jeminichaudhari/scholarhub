export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

function validateUsername(username: string): string | null {
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be at most 20 characters";
  if (!/^[a-zA-Z]/.test(username)) return "Username must start with a letter";
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscore";
  if (/_{2,}/.test(username)) return "Username cannot have consecutive underscores";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password, role, adminSecret, birthdate, mobile } = await req.json();

    if (!name || !username || !email || !password)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    // Validate username format
    const usernameErr = validateUsername(username);
    if (usernameErr)
      return NextResponse.json({ error: usernameErr }, { status: 400 });

    if (role === "admin" && adminSecret !== process.env.ADMIN_SECRET)
      return NextResponse.json({ error: "Invalid admin secret key" }, { status: 403 });

    await connectDB();

    // Check email uniqueness
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return NextResponse.json({ error: "This email is already registered" }, { status: 400 });

    // Check username uniqueness (case-insensitive)
    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists)
      return NextResponse.json({ error: "This username is already taken" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      username:    username.toLowerCase(), // store lowercase
      email,
      password:    hashedPassword,
      role:        role === "admin" ? "admin" : "student",
      dateOfBirth: birthdate || "",
      phone:       mobile || "",
    });

    return NextResponse.json({
      message: "Account created successfully!",
      user: { id: user._id, name: user.name, email: user.email },
    }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

