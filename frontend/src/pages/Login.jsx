import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { authAPI } from '../api/auth';
import useAuthStore from '../context/authStore';
import styles from './AuthForm.module.css';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
    setApiError('');
  };

  const validate = () => {
    const next = {};
    if (!form.email) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await authAPI.login(form);
      const { user, token } = res.data.data;
      setAuth(user, token);
      navigate(user.role === 'SUPER_ADMIN' ? '/super-admin' : '/app/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Unable to sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="AssetFlow - login"
      footer={
        <div className={styles.signupPanel}>
          <div className={styles.divider} />
          <div className={styles.signupHeader}>New here?</div>
          <p className={styles.signupCopy}>
            Sign up creates a new organization with you as Admin
          </p>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate('/signup')}
          >
            Create Account
          </Button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className={styles.form} noValidate>
        <AnimatePresence>
          {apiError && (
            <motion.div
              className={styles.apiError}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={16} />
              <span>{apiError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="name@company.com"
          value={form.email}
          onChange={onChange}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={onChange}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className={styles.rowBetween}>
          <Link to="/forgot-password" className={styles.link}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} fullWidth>
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}
