export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// POST â€” send a test reminder email directly with provided data
// This works WITHOUT MongoDB â€” reads reminder data from request body
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { reminders } = await req.json();
  if (!Array.isArray(reminders) || reminders.length === 0)
    return NextResponse.json({ message: "No reminders provided" }, { status: 400 });

  let transporter: any;
  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.verify();
  } catch (err: any) {
    return NextResponse.json({ message: "Email config failed", error: err?.message }, { status: 500 });
  }

  const now      = new Date();
  const todayStr = now.toDateString();
  const sent: string[] = [];
  const skipped: string[] = [];

  for (const r of reminders) {
    const deadline    = new Date(r.deadline);
    const reminderDays: number[] = r.reminderDays || [5, 1];
    const force       = req.nextUrl.searchParams.get("force") === "true";

    for (const day of reminderDays) {
      const reminderDate = new Date(deadline);
      reminderDate.setDate(reminderDate.getDate() - day);
      const isToday = reminderDate.toDateString() === todayStr;

      if (!isToday && !force) {
        skipped.push(`${r.scholarshipTitle} â€” day ${day} not today (${reminderDate.toDateString()})`);
        continue;
      }

      const currentMins = now.getHours() * 60 + now.getMinutes();
      const targetMins  = (r.reminderHour ?? 9) * 60 + (r.reminderMinute ?? 0);
      if (!force && currentMins < targetMins) {
        skipped.push(`${r.scholarshipTitle} â€” time not reached yet (${targetMins} mins, now ${currentMins})`);
        continue;
      }

      const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const ampm  = (r.reminderHour ?? 9) >= 12 ? "PM" : "AM";
      const h12   = (r.reminderHour ?? 9) % 12 || 12;
      const timeStr = `${h12}:${String(r.reminderMinute ?? 0).padStart(2,"0")} ${ampm}`;

      await transporter.sendMail({
        from: `"ScholarHub" <${process.env.EMAIL_USER}>`,
        to:   r.studentEmail,
        subject: daysLeft <= 1 ? `â° Last Day Tomorrow â€” ${r.scholarshipTitle}` : `ðŸ“… ${daysLeft} Days Left â€” ${r.scholarshipTitle}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
            <div style="background:linear-gradient(135deg,#1a2744,#1e3a6e);padding:28px 24px">
              <p style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">ScholarHub Â· Deadline Reminder</p>
              <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0">${r.scholarshipTitle}</h1>
            </div>
            <div style="padding:24px;background:#fff">
              <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <b>${r.studentName || "Student"}</b>,</p>
              <p style="color:#374151;font-size:15px;margin:0 0 20px">ðŸ“… Only <b>${daysLeft} days left</b> to apply.</p>
              <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-bottom:20px">
                <p style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;margin:0">Application Deadline</p>
                <p style="color:#78350f;font-size:20px;font-weight:800;margin:6px 0 0">${deadline.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</p>
              </div>
              <p style="color:#9ca3af;font-size:12px;margin:0 0 20px">â° Scheduled for <b style="color:#374151">${timeStr}</b></p>
              ${r.applyLink ? `<a href="${r.applyLink}" style="display:block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none">Apply Now on Official Site â†’</a>` : ""}
            </div>
          </div>
        `,
      });
      sent.push(`âœ… ${r.studentEmail} â€” ${r.scholarshipTitle}`);
    }
  }

  return NextResponse.json({ message: "Done", sent: sent.length, sent, skipped });
}

