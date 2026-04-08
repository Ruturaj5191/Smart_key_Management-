import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { ROLE } from "../utils/roles";

function roleName(roleId) {
  const id = Number(roleId);
  if (id === ROLE.SUPER_ADMIN) return "Super Admin";
  if (id === ROLE.ADMIN) return "Admin";
  if (id === ROLE.SECURITY) return "Security";
  if (id === ROLE.OWNER) return "Owner";
  return "Unknown";
}

function Field({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1 text-sm font-semibold text-slate-900 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        tones[tone] || tones.slate
      }`}
    >
      {children}
    </span>
  );
}

export default function Profile() {
  const { user } = useAuth();

  const initials = useMemo(() => {
    const n = String(user?.name || "").trim();
    if (!n) return "?";
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "?";
  }, [user?.name]);

  const statusTone =
    user?.status === "ACTIVE" ? "emerald" : user?.status ? "rose" : "slate";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-lg font-bold text-slate-900">
              {initials}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {user?.name || "Profile"}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone="blue">{roleName(user?.role_id)}</Badge>
                <Badge tone={statusTone}>{user?.status || "—"}</Badge>
                <Badge tone="slate">User ID: {user?.id ?? "—"}</Badge>
              </div>
            </div>
          </div>

         
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Account Information
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Basic details about your account.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={user?.name} />
              <Field label="Email" value={user?.email} mono />
              <Field label="Mobile" value={user?.mobile} mono />
              <Field label="Role" value={`${roleName(user?.role_id)} (${user?.role_id ?? "-"})`} />
              <Field label="Status" value={user?.status} />
              <Field label="User ID" value={String(user?.id ?? "-")} mono />
            </div>
          </div>

          {/* Raw JSON */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Raw JSON</div>
                <div className="text-xs text-slate-500">
                  Helpful for debugging and support
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <pre className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Security Tips
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                Don’t share your login token or password.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                Keep your mobile/email updated for alerts.
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                Report suspicious activity to Admin.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Quick Info</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-900">
                  {roleName(user?.role_id)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-900">{user?.status || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Email</span>
                <span className="font-mono text-xs text-slate-900">
                  {user?.email || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
