import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";


export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Just UI helper (autofill emails). You can edit these.



  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login({ email, password });

      // ✅ Don’t select role manually:
      // After login(), AuthContext loads /auth/profile and role_id is known.
      // Send user to home; your Home/App routes can show correct dashboards based on role_id.
      nav("/", { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[20%] left-[20%] h-96 w-96 rounded-full bg-brand-500/20 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] h-96 w-96 rounded-full bg-indigo-500/20 blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand section above card */}
        <div className="mb-8 flex flex-col items-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-xl shadow-brand-500/30 mb-4">
            <span className="text-xl font-bold tracking-tighter">SK</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm font-medium text-slate-400">Sign in to your account</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-900">Email</label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-900">Password</label>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              disabled={busy}
              className="mt-2 h-11 w-full rounded-xl bg-slate-900 text-white text-sm font-semibold shadow-md shadow-slate-900/20 hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>

            <div className="pt-4 text-center text-sm font-medium text-slate-500">
              Don't have an account?{" "}
              <Link className="text-brand-600 hover:text-brand-500 hover:underline transition-colors" to="/register">
                Sign up
              </Link>
            </div>

            {/* <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-1">Demo Accounts</div>
              <div className="text-xs text-slate-500 leading-relaxed font-mono">
                superadmin21@gmail.com<br/>
                admin21@gmail.com<br/>
                security21@gmail.com
              </div>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
}
