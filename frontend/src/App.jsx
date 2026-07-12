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

const SUPER_ADMIN_HOME = '/super-admin';
import Home from './pages/Home';

function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.user?.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return null;
  }

  if (token) {
    return <Navigate to={role === 'SUPER_ADMIN' ? SUPER_ADMIN_HOME : '/app/dashboard'} replace />;
  }

  return <Outlet />;
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function RoleProtectedRoute({ allowedRoles }) {
  const role = useAuthStore((state) => state.user?.role);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={role === 'SUPER_ADMIN' ? SUPER_ADMIN_HOME : '/app/dashboard'} replace />;
    return <Navigate to="/dashboard" replace />;
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
  return <Navigate to={token && role === 'SUPER_ADMIN' ? SUPER_ADMIN_HOME : '/app/dashboard'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/" element={<Home />} />

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

          <Route
            path="/super-admin"
            element={<SuperAdminGate />}
          >
            <Route element={<RoleProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route index element={<PlatformOrganizations />} />
            </Route>
          </Route>

          <Route path="/platform/organizations" element={<Navigate to={SUPER_ADMIN_HOME} replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}

export default App;
