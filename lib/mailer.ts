import nodemailer from "nodemailer";

export function createMailer() {
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";

  if (!user || !pass) {
    throw new Error("EMAIL_USER or EMAIL_PASS is not set in .env.local");
  }

  // Always create a fresh transporter (no connection pooling — avoids stale connections after restart)
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    // Force new connection each time — prevents "connection closed" after laptop sleep/restart
    pool: false,
    tls: { rejectUnauthorized: false },
  });
}

export const FROM = (name = "ScholarHub") =>
  `"${name}" <${process.env.EMAIL_USER}>`;
