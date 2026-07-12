import React from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import styles from './FeatureCard.module.css';

const features = [
  {
    iconName: 'Package',
    title: 'Asset Lifecycle Tracking',
    description: 'Digitize physical assets (laptops, furniture, vehicles) with full history logs from procurement to disposal.',
  },
  {
    iconName: 'RefreshCw',
    title: 'Conflict-Free Allocation',
    description: 'Ensure smooth checkouts and custodian transfers between departments without duplicate assignments.',
  },
  {
    iconName: 'Calendar',
    title: 'Resource Booking',
    description: 'Prevent overlapping reservations. Secure shared conference rooms, test rigs, and equipment with time-slot verification.',
  },
  {
    iconName: 'ClipboardCheck',
    title: 'Maintenance Workflow',
    description: 'Allow employees to report issues, assign technical service teams, track costs, and get approvals within the platform.',
  },
  {
    iconName: 'CheckSquare',
    title: 'Structured Audit Cycles',
    description: 'Schedule routine location checks. Task auditors with verifying actual asset status and reconciling differences.',
  },
  {
    iconName: 'LayoutDashboard',
    title: 'Real-Time Insights & Alerting',
    description: 'Get instant notifications for overdue returns, pending approvals, and track high-level key performance metrics.',
  },
];

// Single Feature Card Component
export function FeatureCard({ iconName, title, description, index }) {
  const IconComponent = Icons[iconName] || Icons.HelpCircle;

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      whileHover={{ 
        y: -6, 
        boxShadow: '0 12px 30px rgba(13, 46, 36, 0.06)'
      }}
    >
      <div className={styles.iconWrapper}>
        <IconComponent className={styles.icon} size={22} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </motion.div>
  );
}

// Features Section wrapper
export default function FeaturesSection() {
  return (
    <section className={styles.section} id="features">
      <div className={styles.container}>
        <div className={styles.header}>
          <motion.span
            className={styles.badge}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Capabilities
          </motion.span>
          <motion.h2
            className={styles.mainTitle}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Engineered for complete resource control
          </motion.h2>
          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Ditch complex spreadsheets and static paperwork. Gain immediate transparency over every device, asset, and facility.
          </motion.p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              iconName={feature.iconName}
              title={feature.title}
              description={feature.description}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
