import styles from './AuthLayout.module.css';

/**
 * Shared two-pane dark layout for all auth screens.
 * Left: brand panel with logo image, glow blobs, cyberpunk grid.
 * Right: glassmorphic card with the screen form.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className={styles.page}>
      {/* ── Left: Brand Panel ── */}
      <div className={styles.brandPanel}>
        <div className={styles.brandGrid} />
        <div className={styles.brandContent}>
          <img src="/logo.jpg" alt="AssetFlow Logo" className={styles.brandLogoImg} />
          <h1 className={styles.brandName}>AssetFlow</h1>
          <p className={styles.brandTagline}>
            Enterprise Asset &amp; Resource Management
          </p>
          <div className={styles.brandBadge}>
            <span className={styles.brandBadgeDot} />
            Next-Gen Asset Governance
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardLogo}>
              <img src="/logo.jpg" alt="AssetFlow" className={styles.cardLogoImg} />
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
