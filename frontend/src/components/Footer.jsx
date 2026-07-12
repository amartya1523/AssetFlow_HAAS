import React from 'react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>AF</div>
            <div>
              <h3 className={styles.logoText}>AssetFlow</h3>
              <p className={styles.tagline}>Enterprise Asset & Resource Management</p>
            </div>
          </div>
          
          <div className={styles.links}>
            <div className={styles.group}>
              <h4 className={styles.groupTitle}>Product</h4>
              <a href="#features" className={styles.link}>Features</a>
              <a href="#how-it-works" className={styles.link}>Workflow</a>
              <a href="/login" className={styles.link}>Sign In</a>
            </div>
            <div className={styles.group}>
              <h4 className={styles.groupTitle}>Resources</h4>
              <a href="#" className={styles.link}>Documentation</a>
              <a href="#" className={styles.link}>Help Center</a>
              <a href="#" className={styles.link}>API Reference</a>
            </div>
            <div className={styles.group}>
              <h4 className={styles.groupTitle}>Company</h4>
              <a href="#" className={styles.link}>GitHub</a>
              <a href="#" className={styles.link}>About</a>
              <a href="#" className={styles.link}>Privacy Policy</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} AssetFlow Inc. All rights reserved.
          </p>
          <div className={styles.metaLinks}>
            <a href="#" className={styles.metaLink}>Terms of Service</a>
            <a href="#" className={styles.metaLink}>Privacy Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
