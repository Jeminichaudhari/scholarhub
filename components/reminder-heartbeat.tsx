"use client";
// Silently pings the reminder cron every 60 seconds from the browser
// This ensures reminders fire even if the server-side scheduler doesn't start
import { useEffect } from "react";

export default function ReminderHeartbeat() {
  useEffect(() => {
    const secret = process.env.NEXT_PUBLIC_CRON_SECRET || "scholarhub_cron_2024";

    async function ping() {
      try {
        await fetch(`/api/reminders/send?secret=${secret}`, { method: "GET" });
      } catch {}
    }

    // Ping immediately on load, then every 60 seconds
    ping();
    const id = setInterval(ping, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return null; // renders nothing
}
