export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Dynamically import to prevent webpack from bundling nodemailer/mongoose
  const mod = await import("./lib/reminder-scheduler");
  mod.startReminderScheduler();
}
