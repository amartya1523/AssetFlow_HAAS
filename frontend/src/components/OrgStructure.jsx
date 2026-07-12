import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Key, Database } from 'lucide-react';
import styles from './OrgStructure.module.css';

export default function OrgStructure() {
  const cards = [
    {
      icon: Shield,
      title: 'Create Your Organization',
      desc: 'Set up an isolated workspace under a custom name and unique organizational slug in seconds. You start as the primary administrator with full access.',
    },
    {
      icon: Users,
      title: 'Invite & Allocate Members',
      desc: 'Onboard administrators, asset managers, department heads, and employees. Add them directly from your internal User Management console.',
    },
    {
      icon: Key,
      title: 'Custom Permission Overrides',
      desc: 'Define precise access control levels per user. Grant or revoke specific module permissions beyond default role matrices with absolute ease.',
    },
    {
      icon: Database,
      title: 'Strict Data Isolation',
      desc: 'All assets, bookings, checklists, and activity audits are cryptographically and logically locked to your tenant workspace. Zero data leakages.',
    },
  ];

  return (
    <section className={styles.section} id="organization-structure">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left Column: Theory and Headline */}
          <div className={styles.leftCol}>
            <span className={styles.badge}>SaaS Infrastructure</span>
            <h2 className={styles.title}>
              Enterprise-grade <br />
              <span className={styles.glowText}>multi-tenant isolation</span>
            </h2>
            <p className={styles.description}>
              AssetFlow is built for teams of all sizes. Instead of complex setup configurations, spin up a secure tenant workspace for your entire company instantly. Add your employees, configure custom role permissions, and start governing your hardware resources under a unified, isolated database layer.
            </p>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <span className={styles.statVal}>100%</span>
                <span className={styles.statLbl}>Data Isolation</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statVal}>Zero</span>
                <span className={styles.statLbl}>Cross-Tenant Leaks</span>
              </div>
            </div>
          </div>

          {/* Right Column: Key Details */}
          <div className={styles.rightCol}>
            <div className={styles.flowList}>
              {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={idx}
                    className={styles.flowCard}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className={styles.iconWrapper}>
                      <Icon size={20} className={styles.icon} />
                    </div>
                    <div className={styles.cardContent}>
                      <h3 className={styles.cardTitle}>{card.title}</h3>
                      <p className={styles.cardDesc}>{card.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
