import styles from './Logo.module.css';

/**
 * Circular AF identity mark used across auth screens and sidebar.
 */
export default function Logo({ size = 48 }) {
  return (
    <div className={styles.logo} style={{ width: size, height: size }}>
      <span style={{ fontSize: size * 0.38 }}>AF</span>
    </div>
  );
}
