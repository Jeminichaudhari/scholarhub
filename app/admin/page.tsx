export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/dashboard");
  return <AdminClient />;
}
