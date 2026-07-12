import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MessageSquare,
  MailCheck,
  Clock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { notificationAPI } from '../api/dashboard';
import Button from '../components/Button';
import styles from './Notifications.module.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Notification Row ─────────────────────────────────────────────────────────

const CATEGORY_META = {
  ALERT:    { icon: ShieldAlert,    color: 'red',    label: 'Alert' },
  APPROVAL: { icon: CheckCircle2,   color: 'blue',   label: 'Approval' },
  BOOKING:  { icon: Calendar,       color: 'purple', label: 'Booking' },
  GENERAL:  { icon: MessageSquare,  color: 'teal',   label: 'General' },
};

function NotificationItem({ notification, onMarkRead, index }) {
  const meta = CATEGORY_META[notification.category] || CATEGORY_META.GENERAL;
  const { icon: Icon } = meta;

  const handleRowClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
  };

  return (
    <motion.div
      className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
      onClick={handleRowClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ x: notification.isRead ? 0 : 3 }}
    >
      <div className={`${styles.iconContainer} ${styles[`icon_${meta.color}`]}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className={styles.content}>
        <div className={styles.messageRow}>
          <p className={styles.message}>{notification.message}</p>
          {!notification.isRead && (
            <span className={styles.unreadBadge}>New</span>
          )}
        </div>
        <div className={styles.meta}>
          <span className={`${styles.categoryTag} ${styles[`tag_${meta.color}`]}`}>
            {meta.label}
          </span>
          <span className={styles.time}>
            <Clock size={11} />
            {fmtRelative(notification.createdAt)}
          </span>
        </div>
      </div>
      {!notification.isRead && (
        <div className={styles.arrow}>
          <ChevronRight size={14} />
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ALERT' | 'APPROVAL' | 'BOOKING'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // list endpoint can filter by category on the backend
      const res = await notificationAPI.list(activeTab === 'ALL' ? null : activeTab);
      setNotifications(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchCount = useCallback(async () => {
    try {
      const res = await notificationAPI.unreadCount();
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchCount();
  }, [fetchNotifications, fetchCount]);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const tabs = [
    { id: 'ALL',      label: 'All Activity' },
    { id: 'ALERT',    label: 'Alerts' },
    { id: 'APPROVAL', label: 'Approvals' },
    { id: 'BOOKING',  label: 'Bookings' },
  ];

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className={styles.title}>Notifications Center</h2>
          <p className={styles.subtitle}>
            Manage alerts, approvals, and resource updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" onClick={handleMarkAllRead}>
            <MailCheck size={15} />
            Mark all read
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {isActive && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="notif-tabs"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}
                <span className={styles.tabText}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List */}
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loadingState}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skeletonCircle} />
                <div className={styles.skeletonTextContainer}>
                  <div className={styles.skeletonLineShort} />
                  <div className={styles.skeletonLineLong} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <AlertTriangle size={32} />
            <p>{error}</p>
            <Button onClick={fetchNotifications}>Retry</Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={42} />
            <p className={styles.emptyText}>No notifications here</p>
            <span className={styles.emptySubText}>
              We&apos;ll notify you when actions are completed or need your attention.
            </span>
          </div>
        ) : (
          <div className={styles.notificationList}>
            <AnimatePresence>
              {notifications.map((n, idx) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
