import React from 'react';
import { motion } from 'framer-motion';
import styles from './TechStrip.module.css';

const securityFeatures = [
  { name: 'SOC 2 Type II Ready', color: '#10b981' },
  { name: 'ISO 27001 Aligned', color: '#6366f1' },
  { name: 'GDPR Compliant', color: '#f59e0b' },
  { name: 'TLS 1.3 Encryption', color: '#3b82f6' },
  { name: 'AES-256 Data Rest', color: '#ec4899' },
  { name: '99.9% Uptime SLA', color: '#14b8a6' },
];

export default function TechStrip() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.span
          className={styles.title}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          ENTERPRISE-GRADE SECURITY & COMPLIANCE GUARDS
        </motion.span>
        
        <div className={styles.strip}>
          {securityFeatures.map((feat, i) => (
            <motion.div
              key={feat.name}
              className={styles.badge}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ 
                scale: 1.05, 
                y: -2,
                borderColor: 'rgba(99, 102, 241, 0.4)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
              }}
            >
              <span className={styles.dot} style={{ backgroundColor: feat.color }} />
              <span className={styles.name}>{feat.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
