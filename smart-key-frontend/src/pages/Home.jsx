import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE } from "../utils/roles";

function Card({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:bg-slate-50 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">{desc}</div>
        </div>
        <span className="text-slate-400">→</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const roleId = Number(user?.role_id);

  // Optional: auto-send to dashboard pages
  // if (roleId === ROLE.SUPER_ADMIN) return <Navigate to="/superadmin" replace />;
  // if (roleId === ROLE.ADMIN) return <Navigate to="/admin" replace />;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          Welcome, <span className="font-semibold text-slate-900">{user?.name}</span>
        </p>
        <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Role ID: {roleId}
        </div>
      </div>

      {(roleId === ROLE.ADMIN || roleId === ROLE.SUPER_ADMIN) && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Admin Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              to="/admin/requests"
              title="Approve / Reject Requests"
              desc="Manage all key requests (pending/approved/rejected)."
            />
            <Card
              to="/admin/orgs"
              title="Organizations"
              desc="Create and manage organizations."
            />
            <Card
              to="/admin/units"
              title="Units"
              desc="Create units and assign owners."
            />
            <Card
              to="/admin/keys"
              title="Keys"
              desc="Register and manage keys."
            />
            <Card
              to="/admin/reports"
              title="Reports"
              desc="Issued keys and audit logs."
            />
          </div>
        </div>
      )}

      {roleId === ROLE.SUPER_ADMIN && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Super Admin Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/superadmin/users" title="Users" desc="Create/manage users." />
            <Card to="/superadmin/roles" title="Roles" desc="View role list." />
            <Card
              to="/superadmin/security-assign"
              title="Security Assign"
              desc="Assign security users to organizations."
            />
          </div>
        </div>
      )}

      {roleId === ROLE.OWNER && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Owner Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/owner/units" title="My Units" desc="View your units." />
            <Card to="/owner/keys" title="My Keys" desc="View keys in your units." />
            <Card to="/owner/requests" title="My Requests" desc="Create and track requests." />
            <Card to="/owner/notifications" title="Notifications" desc="View alerts and updates." />
          </div>
        </div>
      )}

      {roleId === ROLE.SECURITY && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Security Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/security/orgs" title="Assigned Orgs" desc="View your assigned orgs." />
            <Card to="/security/open" title="Open Transactions" desc="Keys issued and not returned." />
            <Card to="/security/issue" title="Issue Key" desc="Issue approved key to user." />
            <Card to="/security/return" title="Return Key" desc="Return by key or transaction id." />
          </div>
        </div>
      )}
    </div>
  );
}
