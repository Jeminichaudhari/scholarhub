"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  category: string;
  income: number;
  aadharNumber: string;
  bankAccount: string;
  ifscCode: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => { setProfile(d.user || {}); setLoading(false); });
    }
  }, [status, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    setMsg(data.message || "Update ho gaya!");
    setSaving(false);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">
          ← Dashboard
        </Link>
        <span className="text-sm text-gray-500">{session?.user?.email}</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Aapki Profile</h2>
        <p className="text-gray-500 text-sm mb-6">
          Profile update karein / પ્રોફાઇલ અપડેટ કરો
        </p>

        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
            {msg}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Naam / Name</label>
              <input type="text" value={profile.name || ""} onChange={e => setProfile({...profile, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input type="tel" value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})}
                placeholder="10 digit number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth / જન્મ તારીખ</label>
              <input type="date" value={profile.dateOfBirth || ""} onChange={e => setProfile({...profile, dateOfBirth: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender / લિંગ</label>
              <select value={profile.gender || ""} onChange={e => setProfile({...profile, gender: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="Male">Male / પુરુષ</option>
                <option value="Female">Female / સ્ત્રી</option>
                <option value="Other">Other / અન્ય</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category / શ્રેણી</label>
              <select value={profile.category || ""} onChange={e => setProfile({...profile, category: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="General">General / સામાન્ય</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="OBC">OBC</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (₹) / વાર્ષિક આવક</label>
              <input type="number" value={profile.income || ""} onChange={e => setProfile({...profile, income: Number(e.target.value)})}
                placeholder="e.g. 250000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address / સરનામું</label>
            <textarea value={profile.address || ""} onChange={e => setProfile({...profile, address: e.target.value})}
              rows={2} placeholder="Ghar ka address"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Bank Details / બેંક વિગત</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Aadhar Number</label>
                <input type="text" maxLength={12} value={profile.aadharNumber || ""} onChange={e => setProfile({...profile, aadharNumber: e.target.value})}
                  placeholder="12 digit Aadhar"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bank Account Number</label>
                <input type="text" value={profile.bankAccount || ""} onChange={e => setProfile({...profile, bankAccount: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">IFSC Code</label>
                <input type="text" value={profile.ifscCode || ""} onChange={e => setProfile({...profile, ifscCode: e.target.value})}
                  placeholder="e.g. SBIN0001234"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50">
            {saving ? "Saving..." : "Profile Save Karein / સાચવો"}
          </button>
        </form>
      </div>
    </div>
  );
}