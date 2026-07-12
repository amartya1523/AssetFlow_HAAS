import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './CTA.module.css';

export default function CTA() {
  return (
    <section className={styles.section}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className={styles.title}>
            Ready to stop tracking assets on spreadsheets?
          </h2>
          <p className={styles.subtitle}>
            Experience conflict-free bookings, structured lifecycles, and fully reconciled audits. Set up AssetFlow for your organization today.
          </p>
          
          <motion.div
            className={styles.actions}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link to="/signup">
              <motion.button
                className={styles.primaryButton}
                whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started Now
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
