import { Link } from "react-router-dom";

export default function SuperAdminDashboard() {
  const cards = [
    { to: "/superadmin/users", title: "Users", desc: "Create and manage users" },
    { to: "/superadmin/roles", title: "Roles", desc: "View/manage roles list" },
    { to: "/superadmin/security-assign", title: "Security Assign", desc: "Assign security users to orgs" },

    // optional links to admin area (SuperAdmin can open Admin pages also)
    { to: "/admin/orgs", title: "Admin: Orgs", desc: "Open admin organizations module" },
    { to: "/admin/reports", title: "Admin: Reports", desc: "Open reports and audit logs" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Super Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">System level controls</p>
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
