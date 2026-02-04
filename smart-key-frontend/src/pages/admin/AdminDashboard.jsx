import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const cards = [
    { to: "/admin/orgs", title: "Organizations", desc: "Create and manage organizations" },
    { to: "/admin/units", title: "Units", desc: "Create units and assign owners" },
    { to: "/admin/keys", title: "Keys", desc: "Register and manage keys" },
    { to: "/admin/requests", title: "Requests", desc: "Approve or reject key requests" },
    { to: "/admin/reports", title: "Reports", desc: "Issued keys and audit logs" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Daily operations management</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50 transition"
          >
            <div className="text-sm font-semibold text-slate-900">{c.title}</div>
            <div className="mt-1 text-sm text-slate-500">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
