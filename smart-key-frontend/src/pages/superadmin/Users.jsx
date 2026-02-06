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
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Users</h2>
            <p className="mt-1 text-sm text-slate-500">Create and manage users</p>
          </div>

          <button
            onClick={load}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              placeholder="Mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="1">SUPER_ADMIN</option>
              <option value="2">ADMIN</option>
              <option value="3">SECURITY</option>
              <option value="4">OWNER</option>
            </select>

            <button
              onClick={create}
              disabled={busy}
              className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800
                         disabled:opacity-60"
            >
              {busy ? "Creating..." : "Create User"}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">{r.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3">{r.role_id}</td>
                    <td className="px-4 py-3">{r.status}</td>
                  </tr>
                ))}

                {!rows.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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
