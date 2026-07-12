import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeftRight,
  Wrench,
  CalendarClock,
  Send,
  AlertTriangle,
  RotateCcw,
  Activity,
  ChevronRight,
  Plus,
  TrendingUp,
  Clock,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ rows = 3, height = 18 }) {
  return (
    <div className={styles.skeletonWrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={styles.skeletonRow}
          style={{ width: `${88 - i * 10}%`, height }}
        />
      ))}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

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

// ─── Activity row ─────────────────────────────────────────────────────────────

const ACTION_ICON = {
  ASSET_ALLOCATED:       { icon: Package,        color: 'blue'   },
  ASSET_RETURNED:        { icon: RotateCcw,      color: 'green'  },
  BOOKING_CREATED:       { icon: CalendarClock,  color: 'purple' },
  BOOKING_CANCELLED:     { icon: CalendarClock,  color: 'red'    },
  BOOKING_RESCHEDULED:   { icon: CalendarClock,  color: 'amber'  },
  TRANSFER_REQUESTED:    { icon: ArrowLeftRight, color: 'amber'  },
  TRANSFER_APPROVED:     { icon: ArrowLeftRight, color: 'green'  },
  TRANSFER_REJECTED:     { icon: ArrowLeftRight, color: 'red'    },
  MAINTENANCE_RAISED:    { icon: Wrench,         color: 'amber'  },
  MAINTENANCE_APPROVED:  { icon: Wrench,         color: 'green'  },
  MAINTENANCE_REJECTED:  { icon: Wrench,         color: 'red'    },
  MAINTENANCE_RESOLVED:  { icon: Wrench,         color: 'blue'   },
  AUDIT_CYCLE_CREATED:   { icon: Activity,       color: 'purple' },
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
          {log.action.replace(/_/g, ' ')}
        </span>
        {log.user && (
          <span className={styles.activityUser}>
            by {log.user.name}
          </span>
        )}
      </div>
      <span className={styles.activityTime}>
        <Clock size={11} /> {fmtRelative(log.createdAt)}
      </span>
    </motion.div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({ icon: Icon, label, to, color }) {
  const navigate = useNavigate();
  return (
    <button
      className={`${styles.quickAction} ${styles[`qa_${color}`]}`}
      onClick={() => navigate(to)}
    >
      <div className={styles.qaIcon}><Icon size={20} /></div>
      <span>{label}</span>
      <ChevronRight size={14} className={styles.qaArrow} />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [kpis, setKpis] = useState(null);
  const [activity, setActivity] = useState([]);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

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
    loadKPIs();
    loadActivity();
  }, [loadKPIs, loadActivity]);

  const isOverdue = kpis?.overdueAllocations > 0;

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
  const recentActivity = overview?.recentActivity || [];

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.page}>
      {/* Greeting header */}
      <motion.div
        className={styles.greeting}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className={styles.greetingTitle}>
            Today&apos;s Overview
          </h2>
          <p className={styles.greetingSubtitle}>
            Welcome back, <strong>{firstName}</strong> · {todayLabel}
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={() => { loadKPIs(); loadActivity(); }}>
          <RotateCcw size={14} />
        </button>
      </motion.div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.kpiGrid}>
        {cards.map((c, i) => (
      {/* Overdue alert banner */}
      <AnimatePresence>
        {isOverdue && !kpisLoading && (
          <motion.div
            className={styles.overdueBanner}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <span className={styles.kpiLabel}>{c.label}</span>
            <span className={styles.kpiValue}>{loading ? '...' : c.value ?? 0}</span>
            <AlertTriangle size={17} />
            <span>
              <strong>{kpis.overdueAllocations}</strong> allocation
              {kpis.overdueAllocations > 1 ? 's are' : ' is'} overdue — review in Allocation &amp; Transfer.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI grid */}
      <div className={styles.kpiGrid}>
        {kpiCards.map((card, i) => (
          <KpiCard
            key={card.label}
            {...card}
            delay={i * 0.06}
            loading={kpisLoading}
          />
        ))}
      </div>

      {/* Quick actions */}
      <motion.div
        className={styles.quickActionsSection}
        initial={{ opacity: 0, y: 8 }}
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
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickActions}>
          <QuickAction icon={Plus}          label="Register Asset"   to="/app/assets"      color="blue"   />
          <QuickAction icon={CalendarClock} label="Book Resource"    to="/app/booking"     color="purple" />
          <QuickAction icon={Wrench}        label="Raise Request"    to="/app/maintenance" color="amber"  />
        </div>
      </motion.div>

      {/* Recent activity */}
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
            <p>No activity yet — data will appear as your team uses AssetFlow.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {activity.map((log, i) => (
              <ActivityRow key={log.id} log={log} index={i} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
