import React from 'react';
import { motion } from 'framer-motion';
import styles from './TechStrip.module.css';

const techs = [
  { name: 'React', color: '#0d2e24' },
  { name: 'Node.js', color: '#0d2e24' },
  { name: 'Express', color: '#0d2e24' },
  { name: 'Prisma ORM', color: '#0d2e24' },
  { name: 'PostgreSQL', color: '#0d2e24' },
  { name: 'Framer Motion', color: '#0d2e24' },
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
          ENGINEERED ON PRODUCTION-GRADE INFRASTRUCTURE
        </motion.span>
        
        <div className={styles.strip}>
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              className={styles.badge}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ 
                scale: 1.03, 
                y: -2,
                boxShadow: '0 8px 24px rgba(13, 46, 36, 0.04)'
              }}
            >
              <span className={styles.dot} />
              <span className={styles.name}>{tech.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
