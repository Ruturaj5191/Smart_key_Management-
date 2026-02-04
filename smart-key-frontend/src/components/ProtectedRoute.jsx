import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthed, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
              <div>
                <div className="text-sm font-semibold text-slate-900">Loading...</div>
                <div className="text-xs text-slate-500">Checking your session</div>
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

  if (!isAuthed) return <Navigate to="/login" replace />;

  return children;
}
