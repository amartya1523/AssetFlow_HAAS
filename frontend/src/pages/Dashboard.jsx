import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  CalendarClock,
  ChevronRight,
  Clock,
  Package,
  Plus,
  RotateCcw,
  Send,
  TrendingUp,
  Wrench,
} from 'lucide-react';
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

function fmtRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Skeleton({ rows = 3, height = 18 }) {
  return (
    <div className={styles.skeletonWrap}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={styles.skeletonRow}
          style={{ width: `${88 - index * 10}%`, height }}
        />
      ))}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, sub, delay = 0, loading }) {
  return (
    <motion.div
      className={`${styles.kpiCard} ${styles[`kpi_${color}`]}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className={styles.kpiTop}>
        <span className={styles.kpiLabel}>{label}</span>
        <div className={`${styles.kpiIcon} ${styles[`kpiIcon_${color}`]}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
      </div>
      {loading ? (
        <div className={styles.kpiSkeleton} />
      ) : (
        <span className={styles.kpiValue}>{value ?? '—'}</span>
      )}
      {sub && <span className={styles.kpiSub}>{sub}</span>}
    </motion.div>
  );
}

const ACTION_ICON = {
  ASSET_ALLOCATED: { icon: Package, color: 'blue' },
  ASSET_RETURNED: { icon: RotateCcw, color: 'green' },
  BOOKING_CREATED: { icon: CalendarClock, color: 'purple' },
  BOOKING_CANCELLED: { icon: CalendarClock, color: 'red' },
  BOOKING_RESCHEDULED: { icon: CalendarClock, color: 'amber' },
  TRANSFER_REQUESTED: { icon: ArrowLeftRight, color: 'amber' },
  TRANSFER_APPROVED: { icon: ArrowLeftRight, color: 'green' },
  TRANSFER_REJECTED: { icon: ArrowLeftRight, color: 'red' },
  MAINTENANCE_RAISED: { icon: Wrench, color: 'amber' },
  MAINTENANCE_APPROVED: { icon: Wrench, color: 'green' },
  MAINTENANCE_REJECTED: { icon: Wrench, color: 'red' },
  MAINTENANCE_RESOLVED: { icon: Wrench, color: 'blue' },
  AUDIT_CYCLE_CREATED: { icon: Activity, color: 'purple' },
};

function ActivityRow({ log, index }) {
  const meta = ACTION_ICON[log.action] || { icon: Activity, color: 'blue' };
  const { icon: Icon } = meta;

  return (
    <motion.div
      className={styles.activityRow}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 + index * 0.03 }}
    >
      <div className={`${styles.activityDot} ${styles[`dot_${meta.color}`]}`}>
        <Icon size={13} strokeWidth={2.5} />
      </div>
      <div className={styles.activityContent}>
        <span className={styles.activityAction}>
          {formatActivityAction(log.action)}
        </span>
        {log.user && <span className={styles.activityUser}>by {log.user.name}</span>}
      </div>
      <span className={styles.activityTime}>
        <Clock size={11} /> {fmtRelative(log.createdAt)}
      </span>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, to, color }) {
  const navigate = useNavigate();

  return (
    <button
      className={`${styles.quickAction} ${styles[`qa_${color}`]}`}
      onClick={() => navigate(to)}
      type="button"
    >
      <div className={styles.qaIcon}>
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <ChevronRight size={14} className={styles.qaArrow} />
    </button>
  );
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'User';

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState(null);
  const [activity, setActivity] = useState([]);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardAPI.overview();
      setOverview(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKPIs = useCallback(async () => {
    setKpisLoading(true);
    try {
      const res = await dashboardAPI.getKPIs();
      setKpis(res.data.data);
    } catch {
      setKpis(null);
    } finally {
      setKpisLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await dashboardAPI.getRecentActivity(15);
      setActivity(res.data.data || []);
    } catch {
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadKPIs();
    loadActivity();
  }, [loadOverview, loadKPIs, loadActivity]);

  const isOverdue = (kpis?.overdueAllocations ?? 0) > 0;
  const recentOverviewActivity = overview?.recentActivity || [];

  const kpiCards = [
    {
      label: 'Available Assets',
      value: kpis?.assets?.available,
      icon: Package,
      color: 'green',
      sub: `of ${kpis?.assets?.total ?? '—'} total`,
    },
    {
      label: 'Allocated',
      value: kpis?.assets?.allocated,
      icon: ArrowLeftRight,
      color: 'blue',
    },
    {
      label: 'In Maintenance',
      value: kpis?.assets?.underMaintenance,
      icon: Wrench,
      color: 'amber',
    },
    {
      label: 'Active Bookings',
      value: kpis?.activeBookings,
      icon: CalendarClock,
      color: 'purple',
    },
    {
      label: 'Pending Transfers',
      value: kpis?.pendingTransfers,
      icon: Send,
      color: 'indigo',
    },
    {
      label: 'Upcoming Returns',
      value: kpis?.upcomingReturns,
      icon: TrendingUp,
      color: 'teal',
      sub: 'next 7 days',
    },
  ];

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const refreshDashboard = () => {
    loadOverview();
    loadKPIs();
    loadActivity();
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.greeting}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className={styles.greetingTitle}>Today&apos;s Overview</h2>
          <p className={styles.greetingSubtitle}>
            Welcome back, <strong>{firstName}</strong> · {todayLabel}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={refreshDashboard} type="button">
          <RotateCcw size={14} />
        </button>
      </motion.div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <AnimatePresence>
        {isOverdue && !kpisLoading && (
          <motion.div
            className={styles.overdueBanner}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <AlertTriangle size={17} />
            <span>
              <strong>{kpis.overdueAllocations}</strong> allocation
              {kpis.overdueAllocations > 1 ? 's are' : ' is'} overdue. Review in
              {' '}
              Allocation &amp; Transfer.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.kpiGrid}>
        {kpiCards.map((card, index) => (
          <KpiCard
            key={card.label}
            {...card}
            delay={index * 0.06}
            loading={kpisLoading}
          />
        ))}
      </div>

      <motion.div
        className={styles.quickActionsSection}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickActions}>
          <QuickAction icon={Plus} label="Register Asset" to="/app/assets" color="blue" />
          <QuickAction
            icon={CalendarClock}
            label="Book Resource"
            to="/app/booking"
            color="purple"
          />
          <QuickAction
            icon={Wrench}
            label="Raise Request"
            to="/app/maintenance"
            color="amber"
          />
        </div>
      </motion.div>

      <motion.div
        className={styles.activityCard}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.33 }}
      >
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Overview Activity</h3>
        </div>

        {loading ? (
          <Skeleton rows={4} height={20} />
        ) : recentOverviewActivity.length === 0 ? (
          <div className={styles.emptyState}>
            <Activity size={36} />
            <p>No activity yet. Data will appear as your organization starts using AssetFlow.</p>
          </div>
        ) : (
          <div className={styles.overviewActivityList}>
            {recentOverviewActivity.map((entry) => (
              <div key={entry.id} className={styles.overviewActivityItem}>
                <div className={styles.overviewActivityDot} />
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
        )}
      </motion.div>

      <motion.div
        className={styles.activityCard}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
      >
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Activity size={16} /> Recent Activity
          </h3>
          <span className={styles.activityCount}>
            {activity.length > 0 ? `${activity.length} events` : ''}
          </span>
        </div>

        {activityLoading ? (
          <Skeleton rows={6} height={20} />
        ) : activity.length === 0 ? (
          <div className={styles.emptyState}>
            <Activity size={36} />
            <p>No activity yet. Data will appear as your team uses AssetFlow.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {activity.map((log, index) => (
              <ActivityRow key={log.id} log={log} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
