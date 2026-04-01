import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";

export default async function DashboardPage() {
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
          <Link href="/scholarships" className="text-sm text-gray-600 hover:text-blue-600">Scholarships</Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg">
              Admin Panel
            </Link>
          )}
          <Link href="/api/auth/signout" className="text-sm text-red-500 hover:text-red-700">
            Logout
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Namaste, {session.user?.name?.split(" ")[0]}! 🙏
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Aapka scholarship dashboard / તમારું ડેશબોર્ડ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Available Scholarships</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">{scholarships.length}+</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Aapka Role</p>
            <p className="text-xl font-semibold text-blue-600 mt-1 capitalize">
              {(session.user as { role?: string }).role || "student"}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-sm text-gray-500">Profile Status</p>
            <p className="text-xl font-semibold text-green-600 mt-1">Active</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Latest Scholarships</h3>
            <Link href="/scholarships" className="text-sm text-blue-600 hover:underline">
              Sab dekho →
            </Link>
          </div>
          <div className="space-y-3">
            {scholarships.map((s: any) => (
              <div key={s._id.toString()} className="border border-gray-100 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Amount: ₹{s.amount.toLocaleString("en-IN")} · Deadline:{" "}
                    {new Date(s.deadline).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Link
                  href="/scholarships"
                  className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                >
                  Apply
                </Link>
              </div>
            ))}
            {scholarships.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">
                Abhi koi scholarship available nahi hai
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}