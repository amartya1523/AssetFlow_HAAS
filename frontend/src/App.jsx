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
import Assets, { AssetDetail } from './pages/Assets';
import Allocation from './pages/Allocation';
import Booking from './pages/Booking';
import Maintenance from './pages/Maintenance';
import Audit from './pages/Audit';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Home from './pages/Home';

function PublicOnlyRoute() {
  const token = useAuthStore((state) => state.token);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return null;
  }

  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function RoleProtectedRoute({ allowedRoles }) {
  const role = useAuthStore((state) => state.user?.role);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
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

function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
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
                <AppLayout />
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
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}

export default App;
