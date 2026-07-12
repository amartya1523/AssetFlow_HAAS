import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../config/nav';
import useAuthStore from '../context/authStore';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.user?.role);

  // Derive page title from current route
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.path));
  const title = current?.label || 'AssetFlow';

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.actions}>
        {role !== 'SUPER_ADMIN' && (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => navigate('/app/notifications')}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={19} />
            <span className={styles.dot} />
          </button>
        )}

        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => {
            logout();
            navigate('/login');
          }}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
