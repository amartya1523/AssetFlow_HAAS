import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { NAV_ITEMS } from '../config/nav';
import useAuthStore from '../context/authStore';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'EMPLOYEE';
  const displayName = user?.name || 'AssetFlow User';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AF';

  // Filter by role-based visibility
  const items = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Logo size={36} />
        <span className={styles.brandName}>AssetFlow</span>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? styles.active : undefined)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className={styles.activePill}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon size={18} className={styles.icon} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
