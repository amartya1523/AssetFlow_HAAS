import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import FeaturesSection from '../components/FeatureCard';
import HowItWorks from '../components/HowItWorks';
import TechStrip from '../components/TechStrip';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import styles from './Home.module.css';

// Lazy-load the Three.js Canvas container for performance optimization
const Hero3D = lazy(() => import('../components/Hero3D'));

export default function Home() {
  const token = useAuthStore((state) => state.token);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className={styles.wrapper}>
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
        <div className={styles.heroContainer}>
          <motion.div
            className={styles.heroContent}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.span className={styles.heroBadge} variants={itemVariants}>
              Next-Gen Asset Management
            </motion.span>
            <motion.h1 className={styles.heroTitle} variants={itemVariants}>
              AssetFlow
            </motion.h1>
            <motion.h2 className={styles.heroTagline} variants={itemVariants}>
              Track. Allocate. Maintain. Everything, in real time.
            </motion.h2>
            <motion.p className={styles.heroDescription} variants={itemVariants}>
              Digitize physical assets and shared resources. Replace spreadsheet chaos with conflict-free allocation, structured lifecycles, and auto-triggered maintenance.
            </motion.p>
            
            <motion.div className={styles.heroActions} variants={itemVariants}>
              {token ? (
                <Link to="/app/dashboard">
                  <motion.button
                    className={styles.primaryBtn}
                    whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go to Dashboard
                  </motion.button>
                </Link>
              ) : (
                <Link to="/signup">
                  <motion.button
                    className={styles.primaryBtn}
                    whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get Started
                  </motion.button>
                </Link>
              )}
              <a href="#how-it-works">
                <motion.button
                  className={styles.secondaryBtn}
                  whileHover={{ scale: 1.03, background: 'rgba(99, 102, 241, 0.05)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Demo
                </motion.button>
              </a>
            </motion.div>
          </motion.div>

          <div className={styles.heroVisual}>
            <Suspense fallback={<div className={styles.fallbackSpinner}>Loading 3D Workspace...</div>}>
              <Hero3D />
            </Suspense>
          </div>
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
