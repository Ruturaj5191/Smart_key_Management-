import { useEffect, useState } from "react";
import api from "../../api/client";

export default function Users() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("4"); // default OWNER

  const load = async () => {
    try {
      const res = await api.get("/superadmin/users");
      setRows(res.data.data);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Users API not available yet");
    }
  };

  const create = async () => {
    if (!name || !email || !roleId) return alert("name, email, role_id required");

    setBusy(true);
    try {
      await api.post("/superadmin/users", {
        name,
        email,
        mobile,
        password,
        role_id: Number(roleId),
      });
      setName("");
      setEmail("");
      setMobile("");
      setPassword("");
      setRoleId("4");
      await load();
    } catch (err) {
      alert(err?.response?.data?.message || err.message || "Create user failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Users</h2>
            <p className="mt-1 text-sm text-slate-500">Create and manage users</p>
          </div>

          <button
            onClick={load}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); create(); }} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input
                required
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <input
                required
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
            <div>
              <input
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              >
                <option value="1">SUPER_ADMIN</option>
                <option value="2">ADMIN</option>
                <option value="3">SECURITY</option>
                <option value="4">OWNER</option>
              </select>

              <button
                type="submit"
                disabled={busy}
                className="h-10 w-full rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-400 transition-all disabled:opacity-50"
              >
                {busy ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">ID</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Email</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Role</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{r.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{r.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {r.role_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                        r.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600 ring-emerald-500/20"
                          : "bg-rose-50 text-rose-600 ring-rose-500/20"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No users found (or API not ready)
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>


        </div>
      </div>
    </div>
  );
}
