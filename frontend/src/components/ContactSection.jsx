import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Trophy, Users, Mail, MessageSquare, CheckCircle, Loader } from 'lucide-react';
import styles from './ContactSection.module.css';

export default function ContactSection() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: 'adc27466-fafa-411e-a497-c0c995f78b36',
          name: formData.name,
          email: formData.email,
          message: formData.message,
          botcheck: '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className={styles.section} id="contact">
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Left Column: Project Credits & Links */}
          <motion.div
            className={styles.infoCol}
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className={styles.badge}>Odoo Hackathon 2026</span>
            <h2 className={styles.title}>
              Dev Titans & <br />
              <span className={styles.glowText}>AssetFlow Project</span>
            </h2>
            
            <p className={styles.description}>
              AssetFlow is a next-generation SaaS asset tracking and resource booking solution engineered specifically for the <strong>Odoo Hackathon 2026</strong>. Our focus is providing complete hardware lifecycle control and data isolation for enterprise teams.
            </p>

            <div className={styles.detailsGroup}>
              <h3 className={styles.subTitle}>
                <Users size={16} className={styles.subIcon} />
                Core Development Team
              </h3>
              <ul className={styles.teamList}>
                <li>Amartya Vikram Singh</li>
                <li>Sanket Mistry</li>
                <li>Hitesh Rawat</li>
                <li>Aryan Ranjit Kumar</li>
              </ul>
            </div>

            <div className={styles.detailsGroup}>
              <h3 className={styles.subTitle}>
                <Trophy size={16} className={styles.subIcon} />
                Project Codebase
              </h3>
              <p className={styles.codeDesc}>
                Our codebase is fully open-source. Explore the architecture, schema structures, and modules on our repository:
              </p>
              <a
                href="https://github.com/amartya1523/AssetFlow_HAAS"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.githubBtn}
              >
                <GitBranch size={18} />
                Explore on GitHub
              </a>
            </div>
          </motion.div>

          {/* Right Column: Web3Forms Contact Form */}
          <motion.div
            className={styles.formCol}
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={styles.formCard}>
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  /* ── Success State ── */
                  <motion.div
                    key="success"
                    className={styles.successState}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.div
                      className={styles.successIconWrap}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                    >
                      <CheckCircle size={48} className={styles.successIcon} strokeWidth={1.5} />
                    </motion.div>
                    <motion.h3
                      className={styles.successTitle}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      Message Sent!
                    </motion.h3>
                    <motion.p
                      className={styles.successMsg}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.42 }}
                    >
                      Thanks for reaching out. We'll get back to you soon.
                    </motion.p>
                    <motion.button
                      className={styles.resetBtn}
                      onClick={() => setStatus('idle')}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                    >
                      Send another message
                    </motion.button>
                  </motion.div>
                ) : (
                  /* ── Form State ── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={styles.formHeader}>
                      <div className={styles.iconCircle}>
                        <Mail size={22} className={styles.mailIcon} />
                      </div>
                      <h3 className={styles.formTitle}>Get in Touch</h3>
                      <p className={styles.formSubtitle}>Send us a message directly via Web3Forms</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                      <div className={styles.formGroup}>
                        <label htmlFor="contact-name" className={styles.label}>Full Name</label>
                        <input
                          type="text"
                          name="name"
                          id="contact-name"
                          className={styles.input}
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="contact-email" className={styles.label}>Email Address</label>
                        <input
                          type="email"
                          name="email"
                          id="contact-email"
                          className={styles.input}
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="contact-message" className={styles.label}>Your Message</label>
                        <textarea
                          name="message"
                          id="contact-message"
                          rows="4"
                          className={styles.textarea}
                          placeholder="Write your feedback or queries here..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                        ></textarea>
                      </div>

                      {status === 'error' && (
                        <p className={styles.errorMsg}>Something went wrong. Please try again.</p>
                      )}

                      <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={status === 'loading'}
                      >
                        {status === 'loading' ? (
                          <>
                            <Loader size={16} className={styles.spinner} />
                            Sending…
                          </>
                        ) : (
                          <>
                            <MessageSquare size={16} />
                            Submit Form
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
