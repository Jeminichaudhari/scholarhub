import { NextRequest, NextResponse } from "next/server";
import { createMailer, FROM } from "@/lib/mailer";
import connectDB from "@/lib/mongodb";
import Reminder from "@/models/Reminder";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // force=true — skip time check (send even if time hasn't arrived yet)
  const force = req.nextUrl.searchParams.get("force") === "true";
  // reset=true — mark all as unsent so they can fire again (for testing)
  const reset = req.nextUrl.searchParams.get("reset") === "true";

  try {
    await connectDB();
  } catch (err: any) {
    return NextResponse.json({ message: "DB connection failed", error: err?.message }, { status: 500 });
  }

  if (reset) {
    // Reset new format
    await Reminder.updateMany(
      {},
      { $set: { "reminderDates.$[].sent": false, sentDays: [] } }
    );
  }

  let transporter: any;
  try {
    transporter = createMailer();
    await transporter.verify();
  } catch (err: any) {
    return NextResponse.json({
      message: "Email config failed. Check EMAIL_USER and EMAIL_PASS in .env.local",
      error: err?.message,
    }, { status: 500 });
  }

  const now      = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const currentMins = now.getHours() * 60 + now.getMinutes();

  const sentLog: string[] = [];
  const errors:  string[] = [];

  // Fetch all reminders with future deadlines
  const reminders = await Reminder.find({ deadline: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } });

  for (const r of reminders) {
    try {
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysLeft = Math.ceil((r.deadline.getTime() - now.getTime()) / msPerDay);

      // ── New format: reminderDates array ──────────────────────────────────
      if (Array.isArray(r.reminderDates) && r.reminderDates.length > 0) {
        for (let i = 0; i < r.reminderDates.length; i++) {
          const rd = r.reminderDates[i];
          if (rd.sent) continue;
          if (rd.date !== todayStr) continue;

          const targetMins = rd.hour * 60 + rd.minute;
          if (!force && currentMins < targetMins) continue;

          // Send email
          await transporter.sendMail({
            from: FROM(),
            to:   r.studentEmail,
            subject: daysLeft <= 1
              ? `⏰ Last Day Tomorrow — ${r.scholarshipTitle}`
              : `📅 ${daysLeft} Days Left — ${r.scholarshipTitle}`,
            html: reminderEmail({
              name:     r.studentName,
              title:    r.scholarshipTitle,
              deadline: r.deadline,
              link:     r.applyLink,
              daysLeft,
              hour:     rd.hour,
              minute:   rd.minute,
            }),
          });

          // Mark this specific date as sent
          await Reminder.updateOne(
            { _id: r._id },
            { $set: { [`reminderDates.${i}.sent`]: true } }
          );

          sentLog.push(`✅ ${r.studentEmail} — ${r.scholarshipTitle} on ${rd.date} at ${rd.hour}:${String(rd.minute).padStart(2,"0")}`);
        }
      } else {
        // ── Legacy format: reminderDays ──────────────────────────────────
        const reminderDays = Array.isArray(r.reminderDays) && r.reminderDays.length > 0
          ? r.reminderDays : [5, 1];

        for (const day of reminderDays) {
          const reminderDate = new Date(r.deadline);
          reminderDate.setDate(reminderDate.getDate() - day);
          const rdStr = reminderDate.toISOString().split("T")[0];
          if (rdStr !== todayStr) continue;
          if ((r.sentDays || []).includes(day)) continue;

          const targetMins = (r.reminderHour ?? 9) * 60 + (r.reminderMinute ?? 0);
          if (!force && currentMins < targetMins) continue;

          await transporter.sendMail({
            from: FROM(),
            to:   r.studentEmail,
            subject: daysLeft <= 1
              ? `⏰ Last Day Tomorrow — ${r.scholarshipTitle}`
              : `📅 ${daysLeft} Days Left — ${r.scholarshipTitle}`,
            html: reminderEmail({
              name:     r.studentName,
              title:    r.scholarshipTitle,
              deadline: r.deadline,
              link:     r.applyLink,
              daysLeft,
              hour:     r.reminderHour ?? 9,
              minute:   r.reminderMinute ?? 0,
            }),
          });

          await Reminder.updateOne({ _id: r._id }, { $addToSet: { sentDays: day } });
          sentLog.push(`✅ ${r.studentEmail} — ${r.scholarshipTitle} (${day}d before)`);
        }
      }
    } catch (err: any) {
      errors.push(`❌ ${r.studentEmail}: ${err?.message}`);
    }
  }

  // Debug info
  const debug = reminders.map(r => ({
    email:       r.studentEmail,
    scholarship: r.scholarshipTitle,
    deadline:    r.deadline,
    serverNow:   now.toString(),
    todayStr,
    currentMins,
    reminderDates: (r.reminderDates || []).map((rd: any) => ({
      date:        rd.date,
      time:        `${rd.hour}:${String(rd.minute).padStart(2,"0")}`,
      targetMins:  rd.hour * 60 + rd.minute,
      isToday:     rd.date === todayStr,
      sent:        rd.sent,
      timeOk:      currentMins >= rd.hour * 60 + rd.minute,
      wouldSend:   rd.date === todayStr && !rd.sent && (force || currentMins >= rd.hour * 60 + rd.minute),
    })),
  }));

  return NextResponse.json({
    message:        "Cron completed",
    totalReminders: reminders.length,
    sent:           sentLog.length,
    log:            sentLog,
    errors,
    debug,
  });
}

function reminderEmail({ name, title, deadline, link, daysLeft, hour = 9, minute = 0 }: {
  name: string; title: string; deadline: Date; link: string;
  daysLeft: number; hour?: number; minute?: number;
}) {
  const deadlineStr = deadline.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const ampm    = hour >= 12 ? "PM" : "AM";
  const h12     = hour % 12 || 12;
  const timeStr = `${h12}:${String(minute).padStart(2,"0")} ${ampm}`;
  const urgency = daysLeft <= 1
    ? "⏰ <b>Last chance!</b> Deadline is <b>tomorrow</b>."
    : `📅 Only <b>${daysLeft} days left</b> to apply.`;

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#1a2744,#1e3a6e);padding:28px 24px">
        <p style="color:#93c5fd;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px">ScholarHub · Deadline Reminder</p>
        <h1 style="color:#fff;font-size:20px;font-weight:800;margin:0">${title}</h1>
      </div>
      <div style="padding:24px;background:#fff">
        <p style="color:#374151;font-size:15px;margin:0 0 16px">Hi <b>${name}</b>,</p>
        <p style="color:#374151;font-size:15px;margin:0 0 20px">${urgency}</p>
        <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-bottom:20px">
          <p style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;margin:0">Application Deadline</p>
          <p style="color:#78350f;font-size:20px;font-weight:800;margin:6px 0 0">${deadlineStr}</p>
        </div>
        <p style="color:#6b7280;font-size:14px;margin:0 0 8px">Don't miss this opportunity. Apply before the deadline.</p>
        <p style="color:#9ca3af;font-size:12px;margin:0 0 20px">⏰ Reminder scheduled for <b style="color:#374151">${timeStr}</b></p>
        ${link ? `<a href="${link}" style="display:block;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none">Apply Now on Official Site →</a>` : ""}
        <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;text-align:center">You set this reminder on ScholarHub.</p>
      </div>
    </div>
  `;
}
