import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Register() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role_id: 4, // default OWNER
  });

  const [busy, setBusy] = useState(false);

  const onChange = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // backend expects role_id, name, email, mobile, password
      await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        role_id: Number(form.role_id),
      });

      alert("Registered successfully ✅ Now login");
      nav("/login", { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Register failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden mt-8 mb-8">
      {/* Background Glows */}
      <div className="absolute top-[10%] right-[20%] h-96 w-96 rounded-full bg-emerald-500/20 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] h-96 w-96 rounded-full bg-brand-500/20 blur-[128px] pointer-events-none" />

      <div className="w-full max-w-[28rem] relative z-10">
        <div className="mb-8 flex flex-col items-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-xl shadow-brand-500/30 mb-4">
            <span className="text-xl font-bold tracking-tighter">SK</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create an account</h2>
          <p className="mt-2 text-sm font-medium text-slate-400">Join to manage your keys securely</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-900">Account Role</label>
              <select
                value={form.role_id}
                onChange={onChange("role_id")}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
              >
                <option value={4}>Owner</option>
                <option value={3}>Security</option>
                <option value={2}>Admin</option>
                <option value={1}>Super Admin</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-900">Full Name</label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                placeholder="John Doe"
                value={form.name}
                onChange={onChange("name")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-900">Email Address</label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                placeholder="you@company.com"
                value={form.email}
                onChange={onChange("email")}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-900">Mobile Number</label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                placeholder="+1 (555) 000-0000"
                value={form.mobile}
                onChange={onChange("mobile")}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-900">Password</label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                placeholder="Create a strong password"
                type="password"
                value={form.password}
                onChange={onChange("password")}
                autoComplete="new-password"
              />
            </div>

            <button
              disabled={busy}
              className="mt-4 h-11 w-full rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-md shadow-brand-500/20 hover:bg-brand-500 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {busy ? "Creating account..." : "Create Account"}
            </button>

            <div className="pt-4 text-center text-sm font-medium text-slate-500">
              Already have an account?{" "}
              <Link className="text-brand-600 hover:text-brand-500 hover:underline transition-colors" to="/login">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
