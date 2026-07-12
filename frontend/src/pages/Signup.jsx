import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { authAPI } from '../api/auth';
import useAuthStore from '../context/authStore';
import styles from './AuthForm.module.css';

export default function Signup() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
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
    if (!form.name.trim()) next.name = 'Full name is required';
    if (!form.email) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 6) next.password = 'At least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await authAPI.signup(form);
      const { user, token } = res.data.data;
      setAuth(user, token);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Unable to create account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing assets in minutes"
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <div className={styles.infoNote}>
        <CheckCircle2 size={15} />
        <span>All new accounts are created as Employee.</span>
      </div>

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
          id="name"
          name="name"
          label="Full name"
          placeholder="Jane Doe"
          value={form.name}
          onChange={onChange}
          error={errors.name}
          autoComplete="name"
        />

        <Input
          id="email"
          name="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
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
          placeholder="At least 6 characters"
          value={form.password}
          onChange={onChange}
          error={errors.password}
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading} fullWidth>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
