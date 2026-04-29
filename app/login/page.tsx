"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap, Mail, Lock, Eye, EyeOff,
  Loader2, KeyRound, ShieldCheck, Shield,
  RotateCcw, CheckCircle2
} from "lucide-react";

type Step = "credentials" | "otp" | "forgot-email" | "forgot-otp" | "forgot-reset" | "forgot-done";
type Role = "student" | "admin";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>("credentials");
  const [role, setRole]         = useState<Role>("student");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp]           = useState("");
  const [maskedEmail, setMasked]= useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);

  const [fpEmail, setFpEmail]     = useState("");
  const [fpOtp, setFpOtp]         = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpConfirm, setFpConfirm] = useState("");
  const [fpMasked, setFpMasked]   = useState("");
  const [showFpPass, setShowFpPass] = useState(false);
  const [showFpConf, setShowFpConf] = useState(false);

  // Theme based on role
  const isAdmin    = role === "admin";
  const grad       = isAdmin ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "linear-gradient(135deg,#2563eb,#3b82f6)";
  const accent     = isAdmin ? "#7c3aed" : "#2563eb";
  const cardBorder = isAdmin ? "#ede9fe" : "#dbeafe";
  const bgStyle    = isAdmin ? "linear-gradient(135deg,#f5f3ff,#ffffff,#f5f3ff)" : "linear-gradient(135deg,#eff6ff,#ffffff,#eff6ff)";
  const ringClass  = isAdmin ? "focus:ring-purple-500" : "focus:ring-blue-500";
  const headingColor = isAdmin ? "#1e1b4b" : "#0f172a";
  const bodyColor    = isAdmin ? "#4c1d95" : "#334155";

  const inp = `w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ${ringClass} transition-colors`;
  const inpStyle = { background: "#fff", color: "#0f172a" };

  function resetAll() {
    setStep("credentials"); setError("");
    setOtp(""); setFpEmail(""); setFpOtp("");
    setFpNewPass(""); setFpConfirm(""); setFpMasked("");
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    if (isAdmin) {
      if (!adminKey) { setError("Admin key is required."); setLoading(false); return; }
      if (adminKey !== "scholarhub@admin2024") { setError("Invalid admin key."); setLoading(false); return; }
    }
    const res = await fetch("/api/auth/send-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message || "Invalid email or password."); return; }
    setMasked(data.maskedEmail);
    if (data.emailFailed) setError("⚠️ Email failed — check terminal for OTP.");
    setStep("otp");
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, otp, redirect: false });
    if (res?.error) { setError("Invalid or expired OTP."); setLoading(false); return; }
    router.push(isAdmin ? "/admin" : "/student");
  }

  async function handleResend() {
    setLoading(true); setError(""); setOtp("");
    await fetch("/api/auth/send-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
  }

  async function handleFpSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send-otp", email: fpEmail }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message); return; }
    setFpMasked(data.maskedEmail); setStep("forgot-otp");
  }

  async function handleFpVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-otp", email: fpEmail, otp: fpOtp }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message); return; }
    setStep("forgot-reset");
  }

  async function handleFpReset(e: React.FormEvent) {
    e.preventDefault();
    if (fpNewPass !== fpConfirm) { setError("Passwords do not match"); return; }
    if (fpNewPass.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", email: fpEmail, otp: fpOtp, newPassword: fpNewPass }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message); return; }
    setStep("forgot-done");
  }

  const isForgotFlow = step.startsWith("forgot");

  return (
    <div className="light min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: bgStyle, colorScheme: "light" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: grad }}>
            <GraduationCap className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: headingColor }}>ScholarHub</h1>
          <p className="mt-1 text-sm" style={{ color: bodyColor }}>
            {isForgotFlow ? "Reset your password" : "Sign in to your account"}
          </p>
        </div>

        {/* Step indicator — login only */}
        {!isForgotFlow && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {["Password", "Verify OTP"].map((label, i) => {
              const active = (i === 0 && step === "credentials") || (i === 1 && step === "otp");
              const done   = i === 0 && step === "otp";
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    active ? "text-white shadow-sm" : done ? "bg-green-100 text-green-700" : "text-gray-400 bg-gray-100"
                  }`} style={active ? { background: grad } : {}}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      done ? "bg-green-500 text-white" : active ? "bg-white/20" : "bg-gray-200 text-gray-500"
                    }`}>{done ? "✓" : i + 1}</span>
                    {label}
                  </div>
                  {i === 0 && <div className="w-6 h-px bg-gray-200" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div className="rounded-3xl shadow-xl p-8 transition-all duration-300"
          style={{ background: "#ffffff", border: `1.5px solid ${cardBorder}`, colorScheme: "light" }}>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
              <span className="flex-shrink-0">⚠️</span><p>{error}</p>
            </div>
          )}

          {/* ── CREDENTIALS ── */}
          {step === "credentials" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: headingColor }}>Welcome back</h2>
                <p className="text-xs mt-0.5" style={{ color: bodyColor }}>Enter your details to sign in</p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>Login as</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isAdmin ? <Shield size={15} className="text-purple-400" /> : <GraduationCap size={15} className="text-blue-400" />}
                  </div>
                  <select value={role}
                    onChange={e => { setRole(e.target.value as Role); setError(""); setAdminKey(""); }}
                    style={{ background: "#fff", color: accent, borderColor: isAdmin ? "#c4b5fd" : "#93c5fd" }}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 ${ringClass} appearance-none cursor-pointer font-semibold transition-colors`}>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" style={inpStyle} className={inp} />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold" style={{ color: headingColor }}>Password</label>
                  <button type="button"
                    onClick={() => { setFpEmail(email); setError(""); setStep("forgot-email"); }}
                    className="text-xs font-medium hover:opacity-80 transition-opacity"
                    style={{ color: accent }}>
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type={showPass ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                    style={inpStyle} className={`${inp} pr-11`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Admin Key */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>Admin Key</label>
                  <div className="relative">
                    <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input type={showAdminKey ? "text" : "password"} required value={adminKey}
                      onChange={e => setAdminKey(e.target.value)} placeholder="Enter admin secret key"
                      style={inpStyle} className={`${inp} pr-11`} />
                    <button type="button" onClick={() => setShowAdminKey(!showAdminKey)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showAdminKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Contact your administrator for the secret key.</p>
                </div>
              )}

              <button onClick={handleCredentials} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                style={{ background: grad }}>
                {loading ? <><Loader2 className="animate-spin" size={16} /> Verifying...</> : `Continue as ${isAdmin ? "Admin" : "Student"} →`}
              </button>
            </div>
          )}

          {/* ── OTP ── */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isAdmin ? "#f5f3ff" : "#eff6ff" }}>
                  <ShieldCheck size={20} style={{ color: accent }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: headingColor }}>2-Step Verification</h2>
                  <p className="text-xs mt-0.5" style={{ color: bodyColor }}>OTP sent to <b>{maskedEmail}</b></p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>Enter 6-digit OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="text" required maxLength={6} value={otp} autoFocus
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="• • • • • •"
                    style={inpStyle}
                    className={`${inp} tracking-[0.5em] font-mono text-center text-xl`} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-center">OTP expires in 5 minutes</p>
              </div>
              <button onClick={handleOtp} disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: grad }}>
                {loading ? <><Loader2 className="animate-spin" size={16} /> Verifying...</> : "Verify & Sign In"}
              </button>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                  className="text-xs text-gray-500 hover:text-gray-700">← Back</button>
                <button onClick={handleResend} disabled={loading}
                  className="text-xs font-medium hover:opacity-80" style={{ color: accent }}>Resend OTP</button>
              </div>
            </div>
          )}

          {/* ── FORGOT EMAIL ── */}
          {step === "forgot-email" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isAdmin ? "#f5f3ff" : "#eff6ff" }}>
                  <RotateCcw size={18} style={{ color: accent }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: headingColor }}>Reset Password</h2>
                  <p className="text-xs mt-0.5" style={{ color: bodyColor }}>Enter your registered email</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="email" required value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                    placeholder="you@example.com" style={inpStyle} className={inp} />
                </div>
                <p className="text-xs text-gray-400 mt-1">We'll send a 6-digit OTP to this email.</p>
              </div>
              <button onClick={handleFpSendOtp} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: grad }}>
                {loading ? <><Loader2 className="animate-spin" size={16} /> Sending...</> : "Send Reset OTP →"}
              </button>
              <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-700 pt-2 border-t border-gray-100 w-full text-left">← Back to login</button>
            </div>
          )}

          {/* ── FORGOT OTP ── */}
          {step === "forgot-otp" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: headingColor }}>Enter Reset OTP</h2>
                <p className="text-xs mt-0.5" style={{ color: bodyColor }}>Sent to <b>{fpMasked}</b></p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>6-digit OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type="text" required maxLength={6} value={fpOtp} autoFocus
                    onChange={e => setFpOtp(e.target.value.replace(/\D/g, ""))} placeholder="• • • • • •"
                    style={inpStyle}
                    className={`${inp} tracking-[0.5em] font-mono text-center text-xl`} />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-center">OTP expires in 5 minutes</p>
              </div>
              <button onClick={handleFpVerifyOtp} disabled={loading || fpOtp.length !== 6}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: grad }}>
                {loading ? <><Loader2 className="animate-spin" size={16} /> Verifying...</> : "Verify OTP →"}
              </button>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button onClick={() => { setStep("forgot-email"); setFpOtp(""); setError(""); }}
                  className="text-xs text-gray-500 hover:text-gray-700">← Back</button>
                <button onClick={() => { setFpOtp(""); handleFpSendOtp({ preventDefault: () => {} } as any); }}
                  disabled={loading} className="text-xs font-medium hover:opacity-80" style={{ color: accent }}>Resend OTP</button>
              </div>
            </div>
          )}

          {/* ── FORGOT RESET ── */}
          {step === "forgot-reset" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: headingColor }}>Set New Password</h2>
                <p className="text-xs mt-0.5" style={{ color: bodyColor }}>Choose a strong new password</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type={showFpPass ? "text" : "password"} required minLength={6}
                    value={fpNewPass} onChange={e => setFpNewPass(e.target.value)} placeholder="Min 6 characters"
                    style={inpStyle} className={`${inp} pr-11`} />
                  <button type="button" onClick={() => setShowFpPass(!showFpPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showFpPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: headingColor }}>Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input type={showFpConf ? "text" : "password"} required
                    value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} placeholder="Repeat new password"
                    style={inpStyle}
                    className={`${inp} pr-11 ${fpConfirm && fpNewPass !== fpConfirm ? "border-red-300" : fpConfirm && fpNewPass === fpConfirm ? "border-green-300" : ""}`} />
                  <button type="button" onClick={() => setShowFpConf(!showFpConf)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showFpConf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fpConfirm && fpNewPass !== fpConfirm && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
                {fpConfirm && fpNewPass === fpConfirm && <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>}
              </div>
              <button onClick={handleFpReset} disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: grad }}>
                {loading ? <><Loader2 className="animate-spin" size={16} /> Resetting...</> : "Reset Password ✓"}
              </button>
            </div>
          )}

          {/* ── FORGOT DONE ── */}
          {step === "forgot-done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: headingColor }}>Password Reset!</h2>
              <p className="text-sm mb-6" style={{ color: bodyColor }}>Your password has been updated. You can now log in.</p>
              <button onClick={resetAll} className="w-full py-3 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ background: grad }}>Back to Login</button>
            </div>
          )}

          {!isForgotFlow && (
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold hover:opacity-80" style={{ color: accent }}>Create account</Link>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Scholarship Portal • Gujarat Government & Central Schemes
        </p>
      </div>
    </div>
  );
}
