import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MailCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { authAPI } from '../api/auth';
import styles from './AuthForm.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll send you a reset link"
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="success"
            className={styles.successBox}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <MailCheck size={40} className={styles.successIcon} />
            <h3 className={styles.successTitle}>Check your inbox</h3>
            <p className={styles.successText}>
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
              (In development the token is logged to the server console.)
            </p>
            <Link to="/reset-password" className={styles.link}>
              I have a token →
            </Link>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            className={styles.form}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {apiError && (
              <div className={styles.apiError}>
                <AlertCircle size={16} />
                <span>{apiError}</span>
              </div>
            )}

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />

            <Button type="submit" loading={loading} fullWidth>
              Send reset link
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
