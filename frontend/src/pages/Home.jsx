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
          background: useMotionTemplate`radial-gradient(450px circle at ${mouseX}px ${mouseY}px, rgba(99, 102, 241, 0.12), transparent 80%)`,
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
              Digitize physical inventories and shared rooms. Replace manual spreadsheets with conflict-free allocation, automated maintenance approval loops, and structured audits.
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

          {/* Futuristic Visual Container for the 3D scene */}
          <div className={styles.heroVisualContainer}>
            <div className={styles.hudOutline}>
              {/* Telemetry Telemetry badges */}
              <div className={styles.telemetryTag}>
                <span className={styles.pulseDot} />
                <span>3D WORKSPACE STABILIZED</span>
              </div>
              <div className={styles.techLabel}>SYSTEM MONITOR [ACTIVE]</div>
              
              {/* Corner crosshairs for HUD styling */}
              <span className={`${styles.corner} ${styles.topLeft}`} />
              <span className={`${styles.corner} ${styles.topRight}`} />
              <span className={`${styles.corner} ${styles.bottomLeft}`} />
              <span className={`${styles.corner} ${styles.bottomRight}`} />

              <div className={styles.heroVisual}>
                <Suspense fallback={
                  <div className={styles.fallbackSpinner}>
                    <span>LOADING WORKSPACE</span>
                  </div>
                }>
                  <Hero3D />
                </Suspense>
              </div>
            </div>
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
