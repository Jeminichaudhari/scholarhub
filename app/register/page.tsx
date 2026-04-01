"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  GraduationCap, Mail, Lock, Eye, EyeOff,
  User, Shield, CheckCircle2, Loader2
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", aadhar: "",
    password: "", confirmPassword: "", agree: false,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = personal info, 2 = password

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function verifyAadhar() {
    if (form.aadhar.length === 12 && /^\d+$/.test(form.aadhar)) {
      setAadharVerified(true);
    } else {
      alert("Please enter a valid 12-digit Aadhaar number");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!form.agree) {
      setError("Please agree to Terms & Conditions");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto login
      const loginRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/");
      }
    } catch {
      setError("Server error. Please check console and try again.");
      setLoading(false);
    }
  }

  const inputClass = "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)"}}>
            <GraduationCap className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ScholarHub</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your scholarship account</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all ${step===1?"text-white shadow-md":"text-gray-400 bg-gray-100"}`}
            style={step===1?{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)"}:{}}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step===1?"bg-white/20":"bg-gray-200 text-gray-500"}`}>1</span>
            Personal Info
          </div>
          <div className="w-8 h-px bg-gray-200" />
          <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full transition-all ${step===2?"text-white shadow-md":"text-gray-400 bg-gray-100"}`}
            style={step===2?{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)"}:{}}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step===2?"bg-white/20":"bg-gray-200 text-gray-500"}`}>2</span>
            Security
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-red-500 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-gray-500 text-xs mt-1">Enter your basic details</p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text" name="name" required
                      value={form.name} onChange={handleChange}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email" name="email" required
                      value={form.email} onChange={handleChange}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Aadhaar */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Aadhaar Number
                    {aadharVerified && (
                      <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text" name="aadhar"
                      value={form.aadhar} onChange={handleChange}
                      placeholder="12-digit Aadhaar number"
                      maxLength={12}
                      className={`${inputClass} ${aadharVerified ? "border-green-300 bg-green-50" : ""}`}
                    />
                  </div>
                  {!aadharVerified ? (
                    <button
                      type="button"
                      onClick={verifyAadhar}
                      className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
                      style={{background:"linear-gradient(135deg,#059669,#047857)"}}>
                      <Shield size={14} /> Verify Aadhaar
                    </button>
                  ) : (
                    <div className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold text-green-700 bg-green-50 border border-green-200 flex items-center justify-center gap-2">
                      <CheckCircle2 size={14} /> Aadhaar Verified Successfully
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!form.name || !form.email) {
                      setError("Please fill name and email");
                      return;
                    }
                    if (!aadharVerified) {
                      setError("Please verify Aadhaar first");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] mt-2"
                  style={{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)"}}>
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <button type="button" onClick={() => setStep(1)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mb-3 transition-colors">
                    ← Back
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">Set Password</h2>
                  <p className="text-gray-500 text-xs mt-1">Choose a strong password</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type={showPass ? "text" : "password"}
                      name="password" required minLength={6}
                      value={form.password} onChange={handleChange}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          form.password.length >= i*2
                            ? i<=2 ? "bg-red-400" : i===3 ? "bg-yellow-400" : "bg-green-500"
                            : "bg-gray-200"
                        }`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        {form.password.length < 4 ? "Weak" : form.password.length < 6 ? "Fair" : form.password.length < 8 ? "Good" : "Strong"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword" required
                      value={form.confirmPassword} onChange={handleChange}
                      placeholder="Repeat your password"
                      className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors ${
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? "border-red-300 focus:ring-red-400"
                          : form.confirmPassword && form.password === form.confirmPassword
                          ? "border-green-300"
                          : "border-gray-200"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox" name="agree"
                    checked={form.agree} onChange={handleChange}
                    className="mt-0.5 accent-blue-600 w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                    I agree to the{" "}
                    <span className="text-blue-600 font-medium">Terms & Conditions</span>
                    {" "}and{" "}
                    <span className="text-blue-600 font-medium">Privacy Policy</span>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{background:"linear-gradient(135deg,#1d4ed8,#4f46e5)"}}>
                  {loading ? (
                    <><Loader2 className="animate-spin" size={16} /> Creating account...</>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            )}
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Scholarship Portal • Gujarat Government & Central Schemes
        </p>
      </div>
    </div>
  );
}