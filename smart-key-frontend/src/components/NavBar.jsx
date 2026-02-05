import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE } from "../utils/roles";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function RoleLabel(roleId) {
  const id = Number(roleId);
  if (id === 1) return "SUPER_ADMIN";
  if (id === 2) return "ADMIN";
  if (id === 3) return "SECURITY";
  if (id === 4) return "OWNER";
  return `ROLE_${id}`;
}

function RoleBadge({ roleId }) {
  const id = Number(roleId);
  const tone =
    id === 1
      ? "bg-slate-200 text-slate-800"
      : id === 2
      ? "bg-indigo-100 text-indigo-700"
      : id === 3
      ? "bg-sky-100 text-sky-700"
      : id === 4
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>
      {RoleLabel(roleId)}
    </span>
  );
}

export default function NavBar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const roleId = Number(user.role_id);

  const isSuperAdmin = roleId === ROLE.SUPER_ADMIN;
  const isAdmin = roleId === ROLE.ADMIN;
  const isOwner = roleId === ROLE.OWNER;
  const isSecurity = roleId === ROLE.SECURITY;

  const links = [
    { to: "/", label: "Home" },
    { to: "/profile", label: "Profile" },
  ];

  // ✅ ADMIN links (ONLY Admin)
  if (isAdmin) {
    links.push(
      { to: "/admin", label: "Admin Dashboard" },
      { to: "/admin/orgs", label: "Orgs" },
      { to: "/admin/units", label: "Units" },
      { to: "/admin/keys", label: "Keys" },
      { to: "/admin/requests", label: "Key Requests" },
      { to: "/admin/reports", label: "Reports" },
      { to: "/admin/setup-requests", label: "Setup Requests" }

    );
  }

  // ✅ SUPER ADMIN links (ONLY SuperAdmin)
  if (isSuperAdmin) {
    links.push(
      { to: "/superadmin", label: "Super Dashboard" },
      { to: "/superadmin/users", label: "Users" },
      { to: "/superadmin/roles", label: "Roles" },
      { to: "/superadmin/security-assign", label: "Security Assign" },

      // Optional: SuperAdmin can also access Admin modules
      { to: "/admin/orgs", label: "Admin Orgs" },
      { to: "/admin/reports", label: "Admin Reports" }
    );
  }

  // ✅ OWNER links
  if (isOwner) {
    links.push(
      { to: "/owner/units", label: "My Units" },
      { to: "/owner/keys", label: "My Keys" },
      { to: "/owner/requests", label: "My Requests" },
      { to: "/owner/notifications", label: "Notifications" },
      { to: "/owner/setup-requests", label: "Setup Request" }

    );
  }

  // ✅ SECURITY links
  if (isSecurity) {
    links.push(
      { to: "/security/orgs", label: "Assigned Orgs" },
      { to: "/security/open", label: "Open Txns" },
      { to: "/security/issue", label: "Issue Key" },
      { to: "/security/return", label: "Return Key" }
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: Brand + Links */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white text-sm font-bold">
                SK
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Smart Key</div>
                <div className="text-xs text-slate-500">Management</div>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cx(
                      "rounded-xl px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    )
                  }
                  end={l.to === "/"}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right: User + Logout */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <div className="text-sm font-semibold text-slate-900">{user.name}</div>
              <RoleBadge roleId={user.role_id} />
              <div className="text-xs text-slate-500">id: {user.id}</div>
            </div>

            <button
              onClick={logout}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
