// TEMPORARILY DISABLED - Uncomment after fixing build
// export async function register() {
//   if (typeof window !== 'undefined') return;
//   if (process.env.NEXT_RUNTIME === 'edge') return;
  
//   try {
//     const mod = await import("./lib/reminder-scheduler");
//     mod.startReminderScheduler();
//   } catch (error) {
//     console.error("Failed to start reminder scheduler:", error);
//   }
// }
