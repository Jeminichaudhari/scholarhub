"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Scholarship {
  _id: string;
  title: string;
  amount: number;
  deadline: string;
  isActive: boolean;
  applicants: string[];
}

export default function AdminClient() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "", description: "", amount: "", eligibility: "",
    deadline: "", applyLink: "", category: "General",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/scholarships")
      .then(r => r.json())
      .then(d => { setScholarships(d.scholarships || []); setLoading(false); });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/scholarships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        category: [form.category],
        deadline: new Date(form.deadline),
      }),
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    setSaving(false);
    if (res.ok) {
      setScholarships(prev => [...prev, data.scholarship]);
      setForm({ title: "", description: "", amount: "", eligibility: "", deadline: "", applyLink: "", category: "General" });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold text-gray-900">← Dashboard</Link>
        <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Admin Panel</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Scholarship Manage Karein</h2>

        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">{msg}</div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Nayi Scholarship Add Karein</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Title</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. PM Scholarship 2025"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                  placeholder="e.g. 50000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>General</option><option>SC</option><option>ST</option><option>OBC</option><option>EWS</option><option>All</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input required type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
              <input required value={form.eligibility} onChange={e => setForm({...form, eligibility: e.target.value})}
                placeholder="e.g. 12th pass, family income under 2.5 lakh"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea required rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official Apply Link (optional)</label>
              <input type="url" value={form.applyLink} onChange={e => setForm({...form, applyLink: e.target.value})}
                placeholder="https://scholarships.gov.in/..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition disabled:opacity-50">
              {saving ? "Adding..." : "Scholarship Add Karein"}
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Sabhi Scholarships ({scholarships.length})
          </h3>
          {loading ? <p className="text-gray-400 text-sm">Loading...</p> : (
            <div className="space-y-3">
              {scholarships.map(s => (
                <div key={s._id} className="flex items-center justify-between border border-gray-100 rounded-lg p-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      ₹{s.amount.toLocaleString("en-IN")} · {s.applicants?.length || 0} applicants ·
                      Deadline: {new Date(s.deadline).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    s.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}