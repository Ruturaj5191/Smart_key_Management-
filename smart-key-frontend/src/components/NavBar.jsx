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
      ? "bg-brand-500/20 text-brand-300 border-brand-500/30"
      : id === 2
      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
      : id === 3
      ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
      : id === 4
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      : "bg-white/10 text-slate-300 border-white/20";

  return (
    <span className={cx("inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wider", tone)}>
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
      { to: "/admin/setup-requests", label: "Setup Requests" },
      { to: "/admin/facility-requests", label: "Facility Requests" },


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
      { to: "/owner/setup-requests", label: "Setup Request" },
      { to: "/owner/request-water", label: "Request Water" },
      { to: "/owner/request-cleaning", label: "Request Cleaning" },
      { to: "/owner/facility-requests", label: "Facility Requests" },



    );
  }

  // ✅ SECURITY links
  if (isSecurity) {
    links.push(
      { to: "/security/orgs", label: "Assigned Orgs" },
      { to: "/security/open", label: "Open Txns" },
      { to: "/security/issue", label: "Issue Key" },
      { to: "/security/return", label: "Return Key" },
      { to: "/security/facility-requests", label: "Facility Requests" },

    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left: Brand + Links */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/20">
                <span className="text-xs font-bold tracking-tighter">SK</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-white tracking-tight">Smart Key</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cx(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 rounded-full border border-white/5 bg-white/5 pr-3 pl-1 py-1">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                <RoleBadge roleId={user.role_id} />
              </div>
            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20"
            >
              Logout
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
