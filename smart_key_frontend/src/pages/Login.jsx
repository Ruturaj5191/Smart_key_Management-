import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate, Navigate } from "react-router-dom";


export default function Login() {
  const { login, isAuthed } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // If already logged in, redirect to dashboard
  if (isAuthed) {
    return <Navigate to="/" replace />;
  }

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
              <div className="relative">
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all shadow-sm"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
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
