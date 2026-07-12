import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * Accessible overlay modal. Closes on backdrop click, Escape key, or the
 * close button. Renders children inside a centered card.
 *
 * Usage:
 *   <Modal open={show} onClose={() => setShow(false)} title="Add Department">
 *     <form>...</form>
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children, contentClassName = '', bodyClassName = '' }) {
  const contentRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Trap focus inside modal
  useEffect(() => {
    if (!open) return;
    contentRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            ref={contentRef}
            className={`${styles.card} ${contentClassName}`}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={`${styles.body} ${bodyClassName}`}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
