import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import styles from './HowItWorks.module.css';

const steps = [
  {
    num: '01',
    title: 'Register Asset',
    desc: 'Input hardware details, tags, serial numbers, and department mappings to start tracking.',
  },
  {
    num: '02',
    title: 'Allocate & Book',
    desc: 'Assign to employees or let them book shared resources without scheduling conflicts.',
  },
  {
    num: '03',
    title: 'Track & Maintain',
    desc: 'Monitor real-time status and trigger automated ticket workflows for repair requests.',
  },
  {
    num: '04',
    title: 'Audit Cycles',
    desc: 'Perform regular physical inspections using location checklists to verify custody.',
  },
  {
    num: '05',
    title: 'Analyze & Report',
    desc: 'Surface resource usage, depreciation rates, and lifecycle analytics via dashboards.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  
  // Track scroll inside this section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Smooth out the scroll progress
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <section ref={sectionRef} className={styles.section} id="how-it-works">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.badge}>Workflow</span>
          <h2 className={styles.mainTitle}>Automated resource lifecycle</h2>
          <p className={styles.subtitle}>
            From initial registration to audits and reporting, govern your assets in five clear steps.
          </p>
        </div>

        {/* Desktop Progress Line */}
        <div className={styles.progressContainer}>
          <div className={styles.lineBg} />
          <motion.div
            className={styles.lineFill}
            style={{ scaleX }}
          />
        </div>

        {/* Steps Grid / Flow */}
        <div className={styles.flow}>
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
            >
              <div className={styles.numWrapper}>
                <span className={styles.num}>{step.num}</span>
              </div>
              <h3 className={styles.title}>{step.title}</h3>
              <p className={styles.desc}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
