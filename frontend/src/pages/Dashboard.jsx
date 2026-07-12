import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { dashboardAPI } from '../api/dashboard';
import useAuthStore from '../context/authStore';
import styles from './Dashboard.module.css';

function formatActivityAction(action) {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'User';
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    dashboardAPI.overview()
      .then((res) => {
        if (!cancelled) setOverview(res.data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const stats = overview?.stats || {};

  const cards = [
    { label: 'Total Assets', value: stats.totalAssets, color: 'blue' },
    { label: 'Active Allocations', value: stats.activeAllocations, color: 'purple' },
    { label: 'Pending Requests', value: stats.pendingRequests, color: 'amber' },
    { label: 'Maintenance Due', value: stats.maintenanceDue, color: 'rose' },
  ];
  const recentActivity = overview?.recentActivity || [];

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

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

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
            <span className={styles.kpiValue}>{loading ? '...' : c.value ?? 0}</span>
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
        {loading ? (
          <div className={styles.emptyState}>
            <p>Loading activity...</p>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className={styles.activityList}>
            {recentActivity.map((entry) => (
              <div key={entry.id} className={styles.activityItem}>
                <div className={styles.activityDot} />
                <div>
                  <strong>{formatActivityAction(entry.action)}</strong>
                  <p>
                    {entry.entityType}
                    {entry.user?.name ? ` by ${entry.user.name}` : ''}
                  </p>
                </div>
                <span>{formatDateTime(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No activity yet. Data will appear as your organization starts using AssetFlow.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
