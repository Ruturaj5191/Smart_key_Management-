import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE } from "../utils/roles";
import { useEffect, useState } from "react";
import api from "../api/client";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-slate-950">
      {count > 99 ? '99+' : count}
    </span>
  );
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
  const [counts, setCounts] = useState({});

  const fetchCounts = async () => {
    if (!user) return;
    try {
      const res = await api.get("/stats/counts");
      setCounts(res.data.data || {});
    } catch (err) {
      console.error("Badge fetch error:", err);
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [user]);

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
      { to: "/owner/water-history", label: "Water History & Bill" },
      { to: "/owner/request-cleaning", label: "Request Cleaning" },
      { to: "/owner/cleaning-history", label: "Cleaning History & Bill" },
      { to: "/owner/request-tea", label: "Request Tea" },
      { to: "/owner/tea-history", label: "Tea History & Bill" },
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
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = "/"}>
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-500/20">
                <span className="text-xs font-bold tracking-tighter">SK</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-white tracking-tight">Smart Key</div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {/* Home & Profile */}
              <NavLink to="/" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")} end>Home</NavLink>
              <NavLink to="/profile" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Profile</NavLink>

              {/* ADMIN links */}
              {isAdmin && (
                <>
                  <NavLink to="/admin" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Dashboard</NavLink>
                  <NavLink to="/admin/orgs" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Orgs</NavLink>
                  <NavLink to="/admin/units" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Units</NavLink>
                  <NavLink to="/admin/keys" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Keys</NavLink>
                  <NavLink to="/admin/requests" className={({ isActive }) => cx("relative rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
                    Key Requests <Badge count={counts.keyRequests} />
                  </NavLink>
                  <NavLink to="/admin/setup-requests" className={({ isActive }) => cx("relative rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
                    Setup <Badge count={counts.setupRequests} />
                  </NavLink>
                  <NavLink to="/admin/facility-requests" className={({ isActive }) => cx("relative rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
                    Facility <Badge count={counts.facilityRequests} />
                  </NavLink>
                  <NavLink to="/admin/prices" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Prices</NavLink>
                </>
              )}

              {/* SUPER ADMIN */}
              {isSuperAdmin && (
                <>
                  <NavLink to="/superadmin" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Super</NavLink>
                  <NavLink to="/superadmin/users" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Users</NavLink>
                  <NavLink to="/superadmin/roles" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Roles</NavLink>
                </>
              )}

              {/* OWNER links */}
              {isOwner && (
                <>
                  <NavLink to="/owner/units" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>My Units</NavLink>
                  <NavLink to="/owner/keys" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>My Keys</NavLink>
                  <NavLink to="/owner/requests" className={({ isActive }) => cx("relative rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
                    My Requests <Badge count={counts.myRequests} />
                  </NavLink>
                  <NavLink to="/owner/setup-requests" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Setup</NavLink>
                  <NavLink to="/owner/notifications" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Notifications</NavLink>

                  {/* Facility Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all">
                      Facility
                      <Badge count={counts.myFacility} />
                      <svg className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <div className="absolute left-0 top-full mt-1 hidden w-56 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-2xl group-hover:block animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Service Requests</div>
                      <NavLink to="/owner/request-water" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Request Water</NavLink>
                      <NavLink to="/owner/request-tea" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Request Tea</NavLink>
                      <NavLink to="/owner/request-cleaning" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Request Cleaning</NavLink>
                      <div className="my-1 border-t border-white/5"></div>
                      <div className="p-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">History & Bills</div>
                      <NavLink to="/owner/water-history" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Water History & Bill</NavLink>
                      <NavLink to="/owner/tea-history" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Tea History & Bill</NavLink>
                      <NavLink to="/owner/cleaning-history" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">Cleaning History & Bill</NavLink>
                    </div>
                  </div>
                </>
              )}

              {/* SECURITY links */}
              {isSecurity && (
                <>
                  <NavLink to="/security/orgs" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Orgs</NavLink>
                  <NavLink to="/security/open" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Open Txns</NavLink>
                  <NavLink to="/security/issue" className={({ isActive }) => cx("relative rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
                    Issue Key <Badge count={counts.issueKey} />
                  </NavLink>
                  <NavLink to="/security/return" className={({ isActive }) => cx("rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>Return Key</NavLink>
                  <NavLink to="/security/facility-requests" className={({ isActive }) => cx("relative rounded-lg px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200")}>
                    Facility <Badge count={counts.facilityRequests} />
                  </NavLink>
                </>
              )}
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
