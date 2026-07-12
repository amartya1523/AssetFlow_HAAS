import Logo from './Logo';
import styles from './AuthLayout.module.css';

/**
 * Shared two-pane layout for all auth screens.
 * Left: brand panel. Right: the screen form (children).
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <Logo size={56} />
          <h1 className={styles.brandName}>AssetFlow</h1>
          <p className={styles.brandTagline}>
            Enterprise Asset &amp; Resource Management
          </p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardLogo}>
              <Logo size={44} />
            </div>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}
