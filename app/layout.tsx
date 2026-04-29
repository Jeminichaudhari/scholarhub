import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers";
import { LanguageProvider } from "@/lib/language-context";
import { ThemeProvider } from "@/components/theme-provider";
import ReminderHeartbeat from "@/components/reminder-heartbeat";

export const metadata: Metadata = {
  title: "Scholarship Portal",
  description: "Scholarship apply karein",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="scholarhub-theme">
          <AuthProvider>
            <LanguageProvider>
              <ReminderHeartbeat />
              {children}
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}