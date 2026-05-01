import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RoleRoute({ allowed = [], children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Loading...</div>
                <div className="text-xs text-slate-500">Verifying permissions</div>
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse bg-slate-900/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const roleId = Number(user.role_id);

  if (!allowed.includes(roleId)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-lg font-semibold text-slate-900">Access denied</h3>
            <p className="mt-1 text-sm text-slate-500">
              You don’t have permission to open this page.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900">
                Not authorized for this route
              </div>
              <div className="mt-1 text-sm text-amber-800">
                Your role_id is <span className="font-semibold">{roleId}</span>. Allowed roles:{" "}
                <span className="font-semibold">{allowed.join(", ") || "-"}</span>.
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4
                           text-sm font-medium text-white hover:bg-slate-800 transition"
              >
                Go to Home
              </a>
              <a
                href="/profile"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4
                           text-sm font-medium text-slate-900 hover:bg-slate-50 transition"
              >
                View Profile
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
