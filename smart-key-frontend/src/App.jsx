import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import { ROLE } from "./utils/roles";
import Register from "./pages/Register";

// superadmin pages
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import Roles from "./pages/superadmin/Roles";
import Users from "./pages/superadmin/Users";
import SuperSecurityAssign from "./pages/superadmin/SecurityAssign";

// admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Orgs from "./pages/admin/Orgs";
import Units from "./pages/admin/Units";
import Keys from "./pages/admin/Keys";
import Requests from "./pages/admin/Requests";
import Reports from "./pages/admin/Reports";
import AdminSetupRequests from "./pages/admin/SetupRequests";

// owner pages
import MyUnits from "./pages/owner/MyUnits";
import MyKeys from "./pages/owner/MyKeys";
import MyRequests from "./pages/owner/MyRequests";
import Notifications from "./pages/owner/Notifications";
import OwnerSetupRequests from "./pages/owner/SetupRequests";



// security pages
import AssignedOrgs from "./pages/security/AssignedOrgs";
import OpenTransactions from "./pages/security/OpenTransactions";
import IssueKey from "./pages/security/IssueKey";
import ReturnKey from "./pages/security/ReturnKey";

export default function App() {
  return (
    <>
      <NavBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ✅ Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.ADMIN, ROLE.SUPER_ADMIN]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ✅ Admin Pages */}
          <Route
            path="/admin/orgs"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.ADMIN, ROLE.SUPER_ADMIN]}>
                  <Orgs />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/units"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.ADMIN, ROLE.SUPER_ADMIN]}>
                  <Units />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/keys"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.ADMIN, ROLE.SUPER_ADMIN]}>
                  <Keys />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.ADMIN, ROLE.SUPER_ADMIN]}>
                  <Requests />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.ADMIN, ROLE.SUPER_ADMIN]}>
                  <Reports />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="/admin/setup-requests" element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLE.ADMIN, ROLE.SUPER_ADMIN]}>
                <AdminSetupRequests />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* ✅ SUPERADMIN Dashboard */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SUPER_ADMIN]}>
                  <SuperAdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* ✅ SUPERADMIN Pages */}
          <Route
            path="/superadmin/users"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SUPER_ADMIN]}>
                  <Users />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/roles"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SUPER_ADMIN]}>
                  <Roles />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/security-assign"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SUPER_ADMIN]}>
                  <SuperSecurityAssign />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Owner */}
          <Route
            path="/owner/units"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.OWNER]}>
                  <MyUnits />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/owner/setup-requests" element={
            <ProtectedRoute>
              <RoleRoute allowed={[ROLE.OWNER]}>
                <OwnerSetupRequests />
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route
            path="/owner/keys"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.OWNER]}>
                  <MyKeys />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/requests"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.OWNER]}>
                  <MyRequests />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/notifications"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.OWNER]}>
                  <Notifications />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          {/* Security */}
          <Route
            path="/security/orgs"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SECURITY]}>
                  <AssignedOrgs />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/open"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SECURITY]}>
                  <OpenTransactions />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/issue"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SECURITY]}>
                  <IssueKey />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/return"
            element={
              <ProtectedRoute>
                <RoleRoute allowed={[ROLE.SECURITY]}>
                  <ReturnKey />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<div className="p-6">404 Not Found</div>} />
        </Routes>
      </div>
    </>
  );
}
