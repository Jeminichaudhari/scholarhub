export async function register() {
  // Skip edge runtime
  if (process.env.NEXT_RUNTIME === "edge") return;

  try {
    const { startReminderScheduler } = await import("./lib/reminder-scheduler");
    startReminderScheduler();
  } catch (e) {
    console.error("Failed to start reminder scheduler:", e);
  }
}
