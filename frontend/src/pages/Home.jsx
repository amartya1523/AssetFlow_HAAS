import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import FeaturesSection from '../components/FeatureCard';
import HowItWorks from '../components/HowItWorks';
import TechStrip from '../components/TechStrip';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import styles from './Home.module.css';

const Hero3D = lazy(() => import('../components/Hero3D'));

export default function Home() {
  const token = useAuthStore((state) => state.token);
  
  // High-performance pointer tracking for neon spotlight glow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = ({ clientX, clientY }) => {
      mouseX.set(clientX);
      mouseY.set(clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Framer Motion staggered animation configurations
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className={styles.wrapper}>
      {/* Immersive radial gradient spotlight following cursor */}
      <motion.div
        className={styles.pointerSpotlight}
        style={{
          background: useMotionTemplate`radial-gradient(550px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.12), transparent 80%)`,
        }}
      />

      {/* Futuristic Grid Overlay Background */}
      <div className={styles.gridOverlay} />

      {/* Navigation Header */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.brand}>
            <span className={styles.navLogo}>AF</span>
            <span className={styles.navLogoText}>AssetFlow</span>
          </div>
          <div className={styles.navActions}>
            {token ? (
              <Link to="/app/dashboard">
                <button className={styles.navButton}>Go to Dashboard</button>
              </Link>
            ) : (
              <>
                <Link to="/login" className={styles.loginLink}>Sign In</Link>
                <Link to="/signup">
                  <button className={styles.navButton}>Get Started</button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Full background 3D canvas */}
        <Suspense fallback={null}>
          <Hero3D />
        </Suspense>

        <div className={styles.heroContainer}>
          <motion.div
            className={styles.heroContent}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span className={styles.heroBadge} variants={itemVariants}>
              Next-Gen Asset Governance
            </motion.span>
            
            <motion.h1 className={styles.heroTitle} variants={itemVariants}>
              AssetFlow
            </motion.h1>
            
            <motion.h2 className={styles.heroTagline} variants={itemVariants}>
              Track. Allocate. Maintain. <br />
              <span className={styles.glowText}>Everything, in real time.</span>
            </motion.h2>
            
            <motion.p className={styles.heroDescription} variants={itemVariants}>
              Digitize physical inventories and shared rooms. Replace manual spreadsheets with conflict-free allocation, automated maintenance loops, and structured audits.
            </motion.p>
            
            <motion.div className={styles.heroActions} variants={itemVariants}>
              {token ? (
                <Link to="/app/dashboard">
                  <motion.button
                    className={styles.primaryBtn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go to Dashboard
                  </motion.button>
                </Link>
              ) : (
                <Link to="/signup">
                  <motion.button
                    className={styles.primaryBtn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              )}
              <a href="#how-it-works">
                <motion.button
                  className={styles.secondaryBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Workflow
                </motion.button>
              </a>
            </motion.div>
          </motion.div>

          {/* Floating Premium Dashboard Mockup widget on the right */}
          <motion.div 
            className={styles.floatingWidgetContainer}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          >
            <div className={styles.glassDashboard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetControlDots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <div className={styles.widgetTitle}>Live Assets Console</div>
                <div className={styles.telemetryPulseContainer}>
                  <span className={styles.telemetryPulse} />
                  <span>SYNCED</span>
                </div>
              </div>

              <div className={styles.widgetList}>
                <div className={styles.widgetItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>MacBook Pro M3 Max</span>
                    <span className={styles.itemMeta}>ID: AF-8022 • IT Department</span>
                  </div>
                  <span className={`${styles.itemStatus} ${styles.statusActive}`}>ACTIVE</span>
                </div>

                <div className={styles.widgetItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>Conference Room Beta</span>
                    <span className={styles.itemMeta}>Time: 14:00 - 16:30 • Reserved</span>
                  </div>
                  <span className={`${styles.itemStatus} ${styles.statusReserved}`}>BOOKED</span>
                </div>

                <div className={styles.widgetItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>3D Printer Rig Alpha</span>
                    <span className={styles.itemMeta}>Ticket: #M-9022 • Heating Issue</span>
                  </div>
                  <span className={`${styles.itemStatus} ${styles.statusMaintenance}`}>REPAIR</span>
                </div>
              </div>

              {/* Graphical representation overlay */}
              <div className={styles.graphContainer}>
                <div className={styles.graphLabel}>Resource Utilization</div>
                <div className={styles.graphBars}>
                  <div className={styles.graphBar} style={{ '--bar-h': '60%' }} />
                  <div className={styles.graphBar} style={{ '--bar-h': '85%' }} />
                  <div className={styles.graphBar} style={{ '--bar-h': '45%' }} />
                  <div className={styles.graphBar} style={{ '--bar-h': '70%' }} />
                  <div className={styles.graphBar} style={{ '--bar-h': '90%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <FeaturesSection />

      {/* How it Works / Lifecycle flow */}
      <HowItWorks />

      {/* Tech Strip */}
      <TechStrip />

      {/* CTA Section */}
      <CTA />

      {/* Footer */}
      <Footer />
    </div>
  );
}
