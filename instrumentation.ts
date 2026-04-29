export async function register() {
  // Only run on Node.js server — skip edge and client
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { startReminderScheduler } = await import("./lib/reminder-scheduler");
    startReminderScheduler();
  } catch (e) {
    console.error("Failed to start reminder scheduler:", e);
  }
}
