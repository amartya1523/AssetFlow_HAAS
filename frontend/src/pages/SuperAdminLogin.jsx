import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { authAPI } from '../api/auth';
import useAuthStore from '../context/authStore';
import styles from './AuthForm.module.css';
import superStyles from './SuperAdminLogin.module.css';

export default function SuperAdminLogin({ signedInRole }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
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

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await authAPI.login(form);
      const { user, token } = res.data.data;
      if (user.role !== 'SUPER_ADMIN') {
        logout();
        setApiError('This portal only accepts Super Admin credentials.');
        return;
      }
      setAuth(user, token);
      navigate('/super-admin', { replace: true });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Unable to sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Super Admin Portal"
      subtitle="Platform-level access for managing all organizations"
      footer={<Link to="/login">Go to tenant login</Link>}
    >
      <div className={superStyles.badge}>
        <ShieldCheck size={17} />
        <span>Use the credentials configured for SUPER_ADMIN in the backend environment.</span>
      </div>

      {signedInRole && signedInRole !== 'SUPER_ADMIN' && (
        <div className={superStyles.warning}>
          You are signed in as {signedInRole.replace(/_/g, ' ')}. Sign out before using Super Admin access.
          <Button type="button" variant="secondary" fullWidth onClick={logout}>
            Sign out current user
          </Button>
        </div>
      )}

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
          id="superAdminEmail"
          name="email"
          label="Super Admin email"
          type="email"
          placeholder="platform-admin@assetflow.com"
          value={form.email}
          onChange={onChange}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          id="superAdminPassword"
          name="password"
          label="Password"
          type="password"
          placeholder="Enter platform password"
          value={form.password}
          onChange={onChange}
          error={errors.password}
          autoComplete="current-password"
        />

        <Button type="submit" loading={loading} fullWidth>
          Open Super Admin Portal
        </Button>
      </form>
    </AuthLayout>
  );
}
