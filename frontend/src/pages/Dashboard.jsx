import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'User';

  const cards = [
    { label: 'Total Assets', value: '—', color: 'blue' },
    { label: 'Active Allocations', value: '—', color: 'purple' },
    { label: 'Pending Requests', value: '—', color: 'amber' },
    { label: 'Maintenance Due', value: '—', color: 'rose' },
  ];

  return (
    <div>
      <motion.div
        className={styles.greeting}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2>
          Welcome back, {firstName}
        </h2>
        <p>Here&apos;s an overview of your asset management dashboard.</p>
      </motion.div>

      <div className={styles.kpiGrid}>
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            className={`${styles.kpiCard} ${styles[c.color]}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <span className={styles.kpiLabel}>{c.label}</span>
            <span className={styles.kpiValue}>{c.value}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className={styles.activityCard}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className={styles.sectionTitle}>Recent Activity</h3>
        <div className={styles.emptyState}>
          <p>No activity yet. Data will appear as your organization starts using AssetFlow.</p>
        </div>
      </motion.div>
    </div>
  );
}
