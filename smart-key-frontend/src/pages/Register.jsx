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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">Register</h2>
            <p className="mt-1 text-sm text-slate-500">Create a new user account</p>
          </div>

          <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select
                value={form.role_id}
                onChange={onChange("role_id")}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {/* Match your DB roles table:
                    1 SUPER_ADMIN, 2 ADMIN, 3 SECURITY, 4 OWNER */}
                <option value={4}>OWNER</option>
                <option value={3}>SECURITY</option>
                <option value={2}>ADMIN</option>
                <option value={1}>SUPER_ADMIN</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Role is required during registration (saved in users.role_id).
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter full name"
                value={form.name}
                onChange={onChange("name")}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter email"
                value={form.email}
                onChange={onChange("email")}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mobile</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter mobile"
                value={form.mobile}
                onChange={onChange("mobile")}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm
                           placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Create password"
                type="password"
                value={form.password}
                onChange={onChange("password")}
                autoComplete="new-password"
              />
            </div>

            <button
              disabled={busy}
              className="h-10 w-full rounded-xl bg-slate-900 text-white text-sm font-medium
                         hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Creating..." : "Create Account"}
            </button>

            <div className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link className="font-medium text-slate-900 hover:underline" to="/login">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
