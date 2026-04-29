"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Mail, Lock, Eye, EyeOff,
  User, Shield, CheckCircle2, Loader2, KeyRound,
  Phone, Calendar, AtSign
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", username: "", email: "",
    mobile: "", birthdate: "",
    password: "", confirmPassword: "",
    role: "student", adminSecret: "",
    agree: false,
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSecret, setShowSecret]   = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [step, setStep]               = useState(1);
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"taken"|"available"|"invalid">("idle");
  const [usernameError, setUsernameError] = useState("");

  function validateUsername(value: string): string {
    if (value.length < 3) return "Minimum 3 characters";
    if (value.length > 20) return "Maximum 20 characters";
    if (!/^[a-zA-Z]/.test(value)) return "Must start with a letter";
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Only letters, numbers, underscore allowed";
    if (/_{2,}/.test(value)) return "No consecutive underscores";
    return "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name === "username") {
      const err = validateUsername(value);
      setUsernameError(err);
      setUsernameStatus("idle");
    }
  }

  async function checkUsername() {
    if (!form.username) return;
    const err = validateUsername(form.username);
    if (err) { setUsernameError(err); setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    try {
      const res = await fetch(`/api/register/check-username?username=${encodeURIComponent(form.username.toLowerCase())}`);
      const data = await res.json();
      setUsernameStatus(data.available ? "available" : "taken");
    } catch {
      setUsernameStatus("idle");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!form.agree) { setError("Please agree to Terms & Conditions"); return; }
    if (usernameStatus === "taken") { setError("Username is already taken"); return; }

    setLoading(true); setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name,
          username:    form.username,
          email:       form.email,
          mobile:      form.mobile,
          birthdate:   form.birthdate,
          password:    form.password,
          role:        form.role,
          adminSecret: form.adminSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      router.push("/login");
    } catch {
      setError("Server error. Please try again.");
      setLoading(false);
    }
  }

  const grad = form.role === "admin"
    ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
    : "linear-gradient(135deg,#2563eb,#3b82f6)";

  const headingColor = form.role === "admin" ? "#1e1b4b" : "#0f172a";
  const bodyColor    = form.role === "admin" ? "#4c1d95" : "#334155";
  const accent       = form.role === "admin" ? "#7c3aed" : "#2563eb";
  const cardBorder   = form.role === "admin" ? "#ede9fe" : "#dbeafe";
  const bgClass      = form.role === "admin" ? "from-purple-50 via-white to-purple-50" : "from-blue-50 via-white to-blue-50";
  const ringClass    = form.role === "admin" ? "focus:ring-purple-500 focus:border-purple-400" : "focus:ring-blue-500 focus:border-blue-400";

  const inp = `w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ${ringClass} bg-white transition-colors text-gray-900 placeholder-slate-400`;

  return (
    <div className="light min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: form.role === "admin" ? "linear-gradient(135deg,#f5f3ff,#ffffff,#f5f3ff)" : "linear-gradient(135deg,#eff6ff,#ffffff,#eff6ff)", colorScheme: "light" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3" style={{ background: grad }}>
            <GraduationCap className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ScholarHub</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your scholarship account</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {["Personal Info", "Security"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                step === i + 1 ? "text-white shadow-sm" : step > i + 1 ? "bg-green-100 text-green-700" : "text-gray-400 bg-gray-100"
              }`} style={step === i + 1 ? { background: grad } : {}}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-white/20" : "bg-gray-200 text-gray-500"
                }`}>{step > i + 1 ? "✓" : i + 1}</span>
                {label}
              </div>
              {i === 0 && <div className="w-6 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl shadow-xl p-8 transition-all duration-300"
          style={{ background: "#ffffff", border: `1.5px solid ${cardBorder}`, colorScheme: "light" }}>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              <span className="flex-shrink-0">⚠️</span><p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold mb-0.5" style={{ color: headingColor }}>Personal Information</h2>
                  <p className="text-xs mt-0.5" style={{ color: bodyColor }}>Enter your basic details</p>
                </div>

                {/* Role — dropdown */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>Register as</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      {form.role === "admin" ? <Shield size={15} className="text-purple-400" /> : <GraduationCap size={15} className="text-blue-400" />}
                    </div>
                    <select
                      value={form.role}
                      onChange={e => setForm(p => ({ ...p, role: e.target.value, adminSecret: "" }))}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 ${ringClass} bg-white transition-colors appearance-none cursor-pointer font-semibold`}
                      style={{ color: form.role === "admin" ? "#7c3aed" : "#2563eb", borderColor: form.role === "admin" ? "#c4b5fd" : "#93c5fd" }}>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="text" name="name" required value={form.name} onChange={handleChange}
                      placeholder="Your full name" className={inp} />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username
                    <span className="ml-1 text-xs text-gray-400 font-normal">(must be unique)</span>
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="text" name="username" required value={form.username}
                      onChange={handleChange} onBlur={checkUsername}
                      placeholder="e.g. john_doe123" maxLength={20}
                      className={`${inp} ${
                        usernameStatus === "taken" || usernameStatus === "invalid" ? "border-red-300 focus:ring-red-400"
                        : usernameStatus === "available" ? "border-green-300 focus:ring-green-400"
                        : ""}`} />
                    {usernameStatus === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Checking...</span>}
                    {usernameStatus === "available" && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={15} />}
                    {(usernameStatus === "taken" || usernameStatus === "invalid") && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg font-bold">✕</span>}
                  </div>
                  {/* Validation message */}
                  {usernameStatus === "invalid" && <p className="text-red-500 text-xs mt-1">⚠ {usernameError}</p>}
                  {usernameStatus === "taken" && <p className="text-red-500 text-xs mt-1">⚠ This username is already taken</p>}
                  {usernameStatus === "available" && <p className="text-green-600 text-xs mt-1">✓ Username is available</p>}
                  {usernameStatus === "idle" && form.username.length > 0 && !usernameError && (
                    <p className="text-gray-400 text-xs mt-1">3–20 chars, letters/numbers/underscore, start with a letter</p>
                  )}
                  {usernameStatus === "idle" && usernameError && (
                    <p className="text-red-500 text-xs mt-1">⚠ {usernameError}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="email" name="email" required value={form.email} onChange={handleChange}
                      placeholder="you@example.com" className={inp} />
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="tel" name="mobile" required value={form.mobile} onChange={handleChange}
                      placeholder="10-digit mobile number" maxLength={10}
                      pattern="[0-9]{10}" className={inp} />
                  </div>
                </div>

                {/* Birthdate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type="date" name="birthdate" required value={form.birthdate} onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                      className={inp} />
                  </div>
                </div>

                {/* Admin secret */}
                {form.role === "admin" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Secret Key</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input type={showSecret ? "text" : "password"} name="adminSecret"
                        value={form.adminSecret} onChange={handleChange}
                        placeholder="Enter admin secret key"
                        className="w-full pl-10 pr-11 py-3 border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50 hover:bg-white transition-colors" />
                      <button type="button" onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}

                <button type="button"
                  onClick={() => {
                    if (!form.name || !form.username || !form.email || !form.mobile || !form.birthdate) {
                      setError("Please fill all fields"); return;
                    }
                    const uErr = validateUsername(form.username);
                    if (uErr) { setError(uErr); return; }
                    if (usernameStatus === "taken") { setError("Username is already taken"); return; }
                    if (usernameStatus === "idle" || usernameStatus === "invalid") { setError("Please wait for username validation"); return; }
                    if (form.role === "admin" && !form.adminSecret) { setError("Admin secret key is required"); return; }
                    setError(""); setStep(2);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] mt-1"
                  style={{ background: grad }}>
                  Continue →
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <button type="button" onClick={() => setStep(1)}
                    className="text-xs text-gray-500 hover:text-blue-600 mb-2 transition-colors">← Back</button>
                  <h2 className="text-lg font-bold" style={{ color: headingColor }}>Set Password</h2>
                  <p className="text-xs mt-0.5" style={{ color: bodyColor }}>Choose a strong password</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type={showPass ? "text" : "password"} name="password" required minLength={6}
                      value={form.password} onChange={handleChange} placeholder="Min 6 characters"
                      className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2 flex gap-1 items-center">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          form.password.length >= i * 2
                            ? i <= 2 ? "bg-red-400" : i === 3 ? "bg-yellow-400" : "bg-green-500"
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
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" required
                      value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password"
                      className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-colors ${
                        form.confirmPassword && form.password !== form.confirmPassword ? "border-red-300"
                        : form.confirmPassword && form.password === form.confirmPassword ? "border-green-300"
                        : "border-gray-200"
                      }`} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                  {form.confirmPassword && form.password === form.confirmPassword && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange}
                    className="mt-0.5 accent-blue-600 w-4 h-4 flex-shrink-0" />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                    I agree to the <span className="text-blue-600 font-medium">Terms & Conditions</span> and <span className="text-blue-600 font-medium">Privacy Policy</span>
                  </span>
                </label>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: grad }}>
                  {loading
                    ? <><Loader2 className="animate-spin" size={16} /> Creating account...</>
                    : `Create ${form.role === "admin" ? "Admin" : "Student"} Account`}
                </button>
              </div>
            )}
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: accent }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
