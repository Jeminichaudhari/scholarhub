export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const { auth } = await import("@/lib/auth");
  const connectDB = (await import("@/lib/mongodb")).default;
  const { default: Scholarship } = await import("@/models/Scholarship");

  const session = await auth();
  if (!session) redirect("/login");

  await connectDB();
  const scholarships = await Scholarship.find({ isActive: true })
    .sort({ deadline: 1 })
    .limit(3)
    .lean();

  const isAdmin = (session.user as { role?: string }).role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Scholarship Portal</h1>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm text-gray-600 hover:text-blue-600">Profile</Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg">
              Admin Panel
            </Link>
          )}
          <Link href="/api/auth/signout" className="text-sm text-red-500 hover:text-red-700">Logout</Link>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Welcome, {session.user?.name?.split(" ")[0]}!
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Available Scholarships</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{scholarships.length}+</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-xl font-semibold text-blue-600 mt-1 capitalize">
              {(session.user as { role?: string }).role || "student"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-xl font-semibold text-green-600 mt-1">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
