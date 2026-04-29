require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ─── OTP Schema ───────────────────────────────────────────────────────────────
// Stores email + OTP + expiry. TTL index auto-deletes expired docs.
const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true, index: { expires: 0 } },
});
const OTP = mongoose.model("OTP", otpSchema);

// ─── User Schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

// ─── Nodemailer Setup ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Helper: Generate 6-digit OTP ────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── STEP 1: Send OTP ─────────────────────────────────────────────────────────
// POST /send-otp  { "email": "user@example.com" }
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete any existing OTP for this email, then save the new one
  await OTP.deleteMany({ email });
  await OTP.create({ email, otp, expiresAt });

  // Send email
  await transporter.sendMail({
    from: `"OTP Login" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Login OTP",
    text: `Your OTP is: ${otp}\n\nIt expires in 5 minutes.`,
    html: `<p>Your OTP is: <b style="font-size:24px">${otp}</b></p><p>Expires in 5 minutes.</p>`,
  });

  console.log(`OTP sent to ${email}: ${otp}`); // remove in production
  res.json({ message: "OTP sent to your email" });
});

// ─── STEP 2: Verify OTP & Login ───────────────────────────────────────────────
// POST /verify-otp  { "email": "user@example.com", "otp": "123456" }
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  // Find the OTP record
  const record = await OTP.findOne({ email });

  if (!record) {
    return res.status(400).json({ message: "OTP not found. Please request a new one." });
  }

  // Check expiry
  if (record.expiresAt < new Date()) {
    await OTP.deleteOne({ email });
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  // Check if OTP matches
  if (record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP. Please try again." });
  }

  // OTP is correct — delete it so it can't be reused
  await OTP.deleteOne({ email });

  // Create user if they don't exist (auto-register on first login)
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email });
    console.log(`New user created: ${email}`);
  }

  res.json({
    message: "Login successful!",
    user: { id: user._id, email: user.email },
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT =3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
