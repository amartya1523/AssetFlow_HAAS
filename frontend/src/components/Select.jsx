import styles from './Select.module.css';

/**
 * Native select dropdown styled to match the design system.
 * Accepts standard <select> props plus an optional `label`.
 */
export default function Select({ label, id, options, error, ...props }) {
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={id}
        className={`${styles.select} ${error ? styles.error : ''}`}
        {...props}
      >
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {label}
            </option>
          );
        })}
      </select>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}
