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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Login</h2>
            <p className="mt-1 text-sm text-slate-500">
              Smart Key Management
            </p>
          </div>

          <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              disabled={busy}
              className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium
                         hover:bg-slate-800 transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Logging in..." : "Login"}
            </button>

<div className="text-sm text-slate-600">
  Don’t have an account?{" "}
  <Link className="font-medium text-slate-900 hover:underline" to="/register">
    Register
  </Link>
</div>

            <div className="text-xs text-slate-500">
              Accounts: superadmin21@gmail.com / admin21@gmail.com / security21@gmail.com / owner email
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
