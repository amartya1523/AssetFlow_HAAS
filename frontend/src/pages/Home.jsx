import React, { lazy, Suspense, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import FeaturesSection from '../components/FeatureCard';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import OrgStructure from '../components/OrgStructure';
import ContactSection from '../components/ContactSection';
import useAuthStore from '../context/authStore';
import styles from './Home.module.css';

const Hero3D = lazy(() => import('../components/Hero3D'));

export default function Home() {
  const token = useAuthStore((s) => s.token);

  // Normalized pointer coordinates for page-wide parallax shifts
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Raw pointer coordinates for high-performance neon spotlight glow positioning
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
      rawMouseX.set(e.clientX);
      rawMouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, rawMouseX, rawMouseY]);

  // Interpolate mouse movements to shift background grid and text wrapper layers
  const gridX = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
  const gridY = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);
  const textX = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const textY = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);

  // Staggered entry animation configurations
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
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
      {/* Immersive radial gradient spotlight following cursor */}
      <motion.div
        className={styles.pointerSpotlight}
        style={{
          background: useMotionTemplate`radial-gradient(550px circle at ${rawMouseX}px ${rawMouseY}px, rgba(99, 102, 241, 0.12), transparent 80%)`,
        }}
      />

      {/* Cybernetic Grid Overlay Background */}
      <motion.div 
        className={styles.gridOverlay} 
        style={{ x: gridX, y: gridY }}
      />

      {/* Navigation Header */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.brand}>
            <img src="/logo.jpg" alt="AssetFlow" className={styles.navLogo} />
            <span className={styles.navLogoText}>AssetFlow</span>
          </div>
          <div className={styles.navActions}>
            {/* Sign In → /dashboard if already logged in, else /login */}
            <Link to={token ? '/dashboard' : '/login'} className={styles.loginLink}>
              {token ? 'Go to Dashboard' : 'Sign In'}
            </Link>
            {/* Get Started → always /signup */}
            <Link to="/signup">
              <button className={styles.navButton}>Get Started</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          {/* Left Column: Hero Content */}
          <motion.div
            className={styles.heroContent}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ x: textX, y: textY }}
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
              <Link to="/signup">
                <motion.button
                  className={styles.primaryBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Started
                </motion.button>
              </Link>
              <a href="#organization-structure">
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

          {/* Right Column: 3D Revolving Rubik's Cube Centerpiece */}
          <motion.div 
            className={styles.floatingWidgetContainer}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            <div className={styles.cubeContainer}>
              <Suspense fallback={null}>
                <Hero3D />
              </Suspense>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <FeaturesSection />

      {/* Multi-Tenant SaaS Organization Structure */}
      <OrgStructure />

      {/* How it Works / Lifecycle flow */}
      <HowItWorks />

      {/* Get in Touch Contact Section & Hackathon Details */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
