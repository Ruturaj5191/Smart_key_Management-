import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE } from "../utils/roles";
import { useEffect, useState } from "react";
import api from "../api/client"; // ✅ adjust path if needed

function Card({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold text-slate-900 tracking-tight">{title}</div>
          <div className="mt-1 text-sm text-slate-500 font-medium">{desc}</div>
        </div>
        <span className="text-brand-500 group-hover:text-brand-600 transition-colors">→</span>
      </div>
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const roleId = Number(user?.role_id);

  // ✅ superadmin overview state
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await api.get("/superadmin/overview");
      setOverview(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Failed to load overview");
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (roleId === ROLE.SUPER_ADMIN) {
      loadOverview();
    }
  }, [roleId]);

  return (
    <div className="space-y-6">
      {/* top welcome */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Dashboard</h2>
          <p className="text-slate-500 text-lg">
            Welcome back, <span className="font-semibold text-slate-900">{user?.name}</span>
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Role ID: {roleId}
          </div>
        </div>
      </div>

      {/* ✅ SUPER ADMIN OVERVIEW */}
      {roleId === ROLE.SUPER_ADMIN && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Overview</h3>
              <p className="font-medium text-slate-500 mt-1">Cross-organization pulse</p>
            </div>

            <button
              onClick={loadOverview}
              disabled={loadingOverview}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            >
              {loadingOverview ? "Loading..." : "Refresh Stats"}
            </button>
          </div>

          {/* totals */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="text-sm font-medium text-slate-500">Organizations</div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {overview?.totals?.organizations ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="text-sm font-medium text-slate-500">Units</div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {overview?.totals?.units ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="text-sm font-medium text-slate-500">Owners</div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {overview?.totals?.owners ?? 0}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="text-sm font-medium text-slate-500">Security</div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {overview?.totals?.security ?? 0}
              </div>
            </div>
          </div>

          {/* org list */}
          <div className="space-y-4">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Organizations & Units</div>

            <div className="space-y-4">
              {(overview?.organizations || []).map((org) => (
                <div
                  key={org.org_id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold text-slate-900 tracking-tight">
                        {org.org_name}{" "}
                        <span className="text-xs font-mono font-normal text-slate-500">#{org.org_id}</span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-slate-500">
                        {org.address || "No address"}{" "}
                        {org.phone_number ? ` • ${org.phone_number}` : ""}
                      </div>
                    </div>

                    <div className="flex gap-2 text-xs font-medium">
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 shadow-sm">
                        Units: {org.total_units ?? org.units?.length ?? 0}
                      </span>
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 shadow-sm">
                        Owners: {org.total_owners ?? 0}
                      </span>
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 shadow-sm">
                        Security: {org.total_security ?? org.security_users?.length ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* units */}
                  <div className="mt-5 pt-5 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Units</div>
                    {org.units?.length ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {org.units.map((u) => (
                          <div
                            key={u.unit_id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                          >
                            <div className="text-sm font-bold text-slate-900 tracking-tight">
                              {u.unit_name || `Unit #${u.unit_id}`}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 font-medium">
                              Owner:{" "}
                              <span className="text-slate-900">
                                {u.owner_name || "—"}
                              </span>{" "}
                              <span className="text-slate-400 font-mono">({u.owner_id || "-"})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-slate-500">No units found</div>
                    )}
                  </div>

                  {/* security */}
                  <div className="mt-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Assigned Security
                    </div>
                    {org.security_users?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {org.security_users.map((s) => (
                          <span
                            key={s.security_id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                            {s.security_name} <span className="text-slate-400 font-mono">({s.security_id})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-slate-500">No security assigned</div>
                    )}
                  </div>
                </div>
              ))}

              {!overview?.organizations?.length ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm">
                  No organizations found
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* existing Admin Tools */}
      {(roleId === ROLE.ADMIN || roleId === ROLE.SUPER_ADMIN) && (
        <div className="space-y-4">
          <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Admin Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/admin/requests" title="Approve / Reject Requests" desc="Manage all key requests." />
            <Card to="/admin/orgs" title="Organizations" desc="Create and manage organizations." />
            <Card to="/admin/units" title="Units" desc="Create units and assign owners." />
            <Card to="/admin/keys" title="Keys" desc="Register and manage keys." />
            <Card to="/admin/reports" title="Reports" desc="Issued keys and audit logs." />
          </div>
        </div>
      )}

      {/* existing Super Admin Tools */}
      {roleId === ROLE.SUPER_ADMIN && (
        <div className="space-y-4 mt-8">
          <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Super Admin Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/superadmin/users" title="Users" desc="Create/manage users." />
            <Card to="/superadmin/roles" title="Roles" desc="View role list." />
            <Card to="/superadmin/security-assign" title="Security Assign" desc="Assign security users to organizations." />
          </div>
        </div>
      )}

      {/* existing owner tools */}
      {roleId === ROLE.OWNER && (
        <div className="space-y-4 mt-8">
          <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Owner Tools</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card to="/owner/units" title="My Units" desc="View your units." />
            <Card to="/owner/keys" title="My Keys" desc="View keys in your units." />
            <Card to="/owner/requests" title="My Requests" desc="Create and track requests." />
            <Card to="/owner/notifications" title="Notifications" desc="View alerts and updates." />
          </div>
        </div>
      )}

      {/* existing security tools */}
      {roleId === ROLE.SECURITY && (
        <div className="space-y-4 mt-8">
          <div className="text-sm font-bold uppercase tracking-wider text-slate-500">Security Tools</div>
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
