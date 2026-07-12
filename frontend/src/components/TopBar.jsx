import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../config/nav';
import { notificationAPI } from '../api/dashboard';
import useAuthStore from '../context/authStore';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);

  // Live unread notifications count
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await notificationAPI.unreadCount();
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 10 seconds for live updates
    const timer = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(timer);
  }, [fetchUnreadCount, pathname]); // Re-fetch on route change as well

  // Derive page title from current route
  const current = NAV_ITEMS.find((item) => pathname.startsWith(item.path));
  const title = current?.label || 'AssetFlow';

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => navigate('/notifications')}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </button>

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

