import { useAuth } from "../auth/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Your account details from /api/auth/profile</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Name</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.name || "-"}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Email</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.email || "-"}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Mobile</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.mobile || "-"}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Role ID</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.role_id ?? "-"}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">Status</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.status || "-"}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs text-slate-500">User ID</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{user?.id ?? "-"}</div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-900">Raw JSON</div>
            <pre className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
