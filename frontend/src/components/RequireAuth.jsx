import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import styles from './RequireAuth.module.css';

/**
 * Route guard. Waits for auth revalidation on first load, then redirects
 * unauthenticated users to /login. Authenticated users proceed.
 */
export default function RequireAuth({ children }) {
  const { token, isInitialized } = useAuthStore();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} />
        <p>Loading AssetFlow…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
