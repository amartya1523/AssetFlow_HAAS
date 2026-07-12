import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import styles from './AppLayout.module.css';

/**
 * Authenticated app shell: persistent Sidebar + TopBar wrapping routed
 * content via <Outlet />. Page transitions animated with Framer Motion.
 */
export default function AppLayout() {
  const location = useLocation();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={styles.page}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
