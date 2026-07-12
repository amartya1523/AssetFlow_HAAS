import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  loading = false,
  disabled = false,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${fullWidth ? styles.fullWidth : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  );
}
