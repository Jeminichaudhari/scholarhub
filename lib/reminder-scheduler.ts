// Background scheduler — checks reminders every minute and sends emails automatically
// Started once via instrumentation.ts when the Next.js server boots

let started = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReminderScheduler() {
  if (started) return;
  started = true;

  console.log("⏰ Reminder scheduler started — checking every 60 seconds");

  // Run immediately on start
  runCheck();

  // Then every 60 seconds
  intervalId = setInterval(() => {
    runCheck();
  }, 60 * 1000);
}

async function runCheck() {
  try {
    const mongoose   = await import("mongoose");
    const nodemailer = await import("nodemailer");

    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scholarship_portal";

    // Connect if not already connected
    if (mongoose.default.connection.readyState === 0) {
      await mongoose.default.connect(MONGODB_URI);
      console.log("⏰ Scheduler connected to MongoDB");
    }

    const { default: Reminder } = await import("../models/Reminder");

    const now         = new Date();
    // Local date string — avoids UTC/IST timezone shift
    const todayStr    = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    // Fetch reminders with deadlines from today onwards
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const reminders    = await Reminder.find({ deadline: { $gte: startOfToday } });

    if (reminders.length === 0) return;

    const EMAIL_USER = process.env.EMAIL_USER || "";
    const EMAIL_PASS = process.env.EMAIL_PASS || "";
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error("⏰ Scheduler: EMAIL_USER or EMAIL_PASS not set");
      return;
    }

    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      pool: false,
      tls: { rejectUnauthorized: false },
    });

    for (const r of reminders) {
      try {
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysLeft = Math.ceil((r.deadline.getTime() - now.getTime()) / msPerDay);

        // ── New format: reminderDates array ──────────────────────────────
        if (Array.isArray(r.reminderDates) && r.reminderDates.length > 0) {
          for (let i = 0; i < r.reminderDates.length; i++) {
            const rd = r.reminderDates[i];
            if (rd.sent) continue;
            if (rd.date !== todayStr) continue;

            const targetMins = rd.hour * 60 + rd.minute;
            if (currentMins < targetMins) continue; // not yet time

            console.log(`📧 Auto-sending: ${r.studentEmail} — ${r.scholarshipTitle} (${rd.date} ${rd.hour}:${String(rd.minute).padStart(2,"0")})`);

            await transporter.sendMail({
              from:    `"ScholarHub" <${EMAIL_USER}>`,
              to:      r.studentEmail,
              subject: daysLeft <= 1
                ? `⏰ Last Day Tomorrow — ${r.scholarshipTitle}`
                : `📅 ${daysLeft} Days Left — ${r.scholarshipTitle}`,
              html: buildEmail({
                name:     r.studentName,
                title:    r.scholarshipTitle,
                deadline: r.deadline,
                link:     r.applyLink,
                daysLeft,
                hour:     rd.hour,
                minute:   rd.minute,
              }),
            });

            await Reminder.updateOne(
              { _id: r._id },
              { $set: { [`reminderDates.${i}.sent`]: true } }
            );

            console.log(`✅ Auto-sent to ${r.studentEmail} for ${r.scholarshipTitle}`);
          }

        } else {
          // ── Legacy format: reminderDays ───────────────────────────────
          const reminderDays = Array.isArray(r.reminderDays) && r.reminderDays.length > 0
            ? r.reminderDays : [5, 1];

          for (const day of reminderDays) {
            if ((r.sentDays || []).includes(day)) continue;

            const reminderDate = new Date(r.deadline);
            reminderDate.setDate(reminderDate.getDate() - day);
            const rdStr = `${reminderDate.getFullYear()}-${String(reminderDate.getMonth()+1).padStart(2,"0")}-${String(reminderDate.getDate()).padStart(2,"0")}`;
            if (rdStr !== todayStr) continue;

            const targetMins = (r.reminderHour ?? 9) * 60 + (r.reminderMinute ?? 0);
            if (currentMins < targetMins) continue;

            await transporter.sendMail({
              from:    `"ScholarHub" <${EMAIL_USER}>`,
              to:      r.studentEmail,
              subject: daysLeft <= 1
                ? `⏰ Last Day Tomorrow — ${r.scholarshipTitle}`
                : `📅 ${daysLeft} Days Left — ${r.scholarshipTitle}`,
              html: buildEmail({
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
            console.log(`✅ Legacy auto-sent to ${r.studentEmail}`);
          }
        }
      } catch (err: any) {
        console.error(`❌ Reminder error for ${r.studentEmail}:`, err?.message);
      }
    }
  } catch (err: any) {
    // Never crash the server
    console.error("❌ Scheduler check error:", err?.message);
  }
}

function buildEmail({ name, title, deadline, link, daysLeft, hour, minute }: {
  name: string; title: string; deadline: Date; link: string;
  daysLeft: number; hour: number; minute: number;
}) {
  const deadlineStr = deadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const ampm    = hour >= 12 ? "PM" : "AM";
  const h12     = hour % 12 || 12;
  const timeStr = `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
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
