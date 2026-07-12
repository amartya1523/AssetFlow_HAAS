import styles from './StatusPill.module.css';

const STATUS_STYLES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  AVAILABLE: 'active',
  ALLOCATED: 'info',
  RESERVED: 'warning',
  UNDER_MAINTENANCE: 'warning',
  LOST: 'danger',
  RETIRED: 'inactive',
  DISPOSED: 'inactive',
  PENDING: 'warning',
  APPROVED: 'active',
  REJECTED: 'danger',
};

/**
 * Rounded status pill badge for table cells.
 * Maps known status strings to color-coded styles.
 * Falls back to a neutral style for unknown statuses.
 */
export default function StatusPill({ status }) {
  const variant = STATUS_STYLES[status] || 'neutral';
  return (
    <span className={`${styles.pill} ${styles[variant]}`}>
      {status}
    </span>
  );
}
