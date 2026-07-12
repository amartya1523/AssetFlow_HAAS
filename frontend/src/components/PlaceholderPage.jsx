import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';
import styles from './PlaceholderPage.module.css';

/**
 * Placeholder for in-app routes that get built in later tasks.
 * Keeps the shell navigable and consistent while modules are stubs.
 */
export default function PlaceholderPage({ title, description }) {
  return (
    <div className={styles.wrap}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.iconWrap}>
          <Construction size={28} />
        </div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.text}>
          {description || 'This module will be built in an upcoming task.'}
        </p>
        <span className={styles.badge}>Coming soon</span>
      </motion.div>
    </div>
  );
}
