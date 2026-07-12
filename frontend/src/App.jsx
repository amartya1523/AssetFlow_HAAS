import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import RequireAuth from './components/RequireAuth';
import useAuthStore from './context/authStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Organization from './pages/Organization';
import UserManagement from './pages/UserManagement';
import Assets, { AssetDetail } from './pages/Assets';
import Allocation from './pages/Allocation';
import Booking from './pages/Booking';
import Maintenance from './pages/Maintenance';
import Audit from './pages/Audit';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import PlatformOrganizations from './pages/PlatformOrganizations';
import SuperAdminLogin from './pages/SuperAdminLogin';
import Home from './pages/Home';

const SUPER_ADMIN_HOME = '/super-admin';
const TENANT_HOME = '/app/dashboard';

function getHomePath(token, role) {
  return token && role === 'SUPER_ADMIN' ? SUPER_ADMIN_HOME : TENANT_HOME;
}

function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return null;
  }

  if (token) {
    return <Navigate to={getHomePath(token, role)} replace />;
  }

  return <Outlet />;
}

function RoleProtectedRoute({ allowedRoles }) {
  const role = useAuthStore((state) => state.user?.role);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={getHomePath(true, role)} replace />;
  }

  return <Outlet />;
}

function TenantAppLayout() {
  const role = useAuthStore((state) => state.user?.role);

  if (role === 'SUPER_ADMIN') {
    return <Navigate to={SUPER_ADMIN_HOME} replace />;
  }

  return <AppLayout />;
}

function SuperAdminGate() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return null;
  }

  if (!token || role !== 'SUPER_ADMIN') {
    return <SuperAdminLogin signedInRole={token ? role : null} />;
  }

  return <AppLayout />;
}

function AuthBootstrap({ children }) {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const revalidate = useAuthStore((state) => state.revalidate);

  useEffect(() => {
    if (!isInitialized) {
      revalidate();
    }
  }, [isInitialized, revalidate]);

  return children;
}

function DefaultRedirect() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return null;
  }

  if (token) {
    return <Navigate to={getHomePath(token, role)} replace />;
  }

  return <Home />;
}

function LegacyAppRedirect({ to }) {
  return <Navigate to={to} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/signup" element={<Signup />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          <Route
            element={(
              <RequireAuth>
                <TenantAppLayout />
              </RequireAuth>
            )}
          >
            <Route path="/app" element={<Outlet />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="assets" element={<Assets />} />
              <Route path="assets/:id" element={<AssetDetail />} />
              <Route path="allocation" element={<Allocation />} />
              <Route path="booking" element={<Booking />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="audit" element={<Audit />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<Notifications />} />

              <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="organization" element={<Organization />} />
                <Route path="users" element={<UserManagement />} />
              </Route>
            </Route>
          </Route>

          <Route
            path="/super-admin"
            element={<SuperAdminGate />}
          >
            <Route element={<RoleProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route index element={<PlatformOrganizations />} />
            </Route>
          </Route>

          <Route path="/platform/organizations" element={<Navigate to={SUPER_ADMIN_HOME} replace />} />
          <Route path="/dashboard" element={<LegacyAppRedirect to={TENANT_HOME} />} />
          <Route path="/assets" element={<LegacyAppRedirect to="/app/assets" />} />
          <Route path="/allocation" element={<LegacyAppRedirect to="/app/allocation" />} />
          <Route path="/booking" element={<LegacyAppRedirect to="/app/booking" />} />
          <Route path="/maintenance" element={<LegacyAppRedirect to="/app/maintenance" />} />
          <Route path="/audit" element={<LegacyAppRedirect to="/app/audit" />} />
          <Route path="/reports" element={<LegacyAppRedirect to="/app/reports" />} />
          <Route path="/notifications" element={<LegacyAppRedirect to="/app/notifications" />} />
          <Route path="/organization" element={<LegacyAppRedirect to="/app/organization" />} />
          <Route path="/users" element={<LegacyAppRedirect to="/app/users" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}

export default App;
