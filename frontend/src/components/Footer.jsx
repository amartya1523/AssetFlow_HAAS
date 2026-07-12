import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <img src="/logo.jpg" alt="AssetFlow Logo" className={styles.logo} />
            <div>
              <h3 className={styles.logoText}>AssetFlow</h3>
              <p className={styles.tagline}>Enterprise Asset & Resource Management</p>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>Built for the Odoo Hackathon 2026.</p>
        </div>
      </div>
    </footer>
  );
}
