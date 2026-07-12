import React from 'react';
import { motion } from 'framer-motion';
import styles from './TechStrip.module.css';

const techs = [
  { name: 'React', color: '#61dafb' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Express', color: '#828282' },
  { name: 'Prisma ORM', color: '#a5b4fc' },
  { name: 'PostgreSQL', color: '#336791' },
  { name: 'Framer Motion', color: '#ff007f' },
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
                scale: 1.05, 
                y: -2,
                borderColor: 'rgba(99, 102, 241, 0.4)',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)'
              }}
            >
              <span className={styles.dot} style={{ backgroundColor: tech.color }} />
              <span className={styles.name}>{tech.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
