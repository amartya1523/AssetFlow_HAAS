import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import Input from '../components/Input';
import { authAPI } from '../api/auth';
import styles from './AuthForm.module.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    token: params.get('token') || '',
    newPassword: '',
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
    if (!form.token) next.token = 'Reset token is required';
    if (!form.newPassword) next.newPassword = 'New password is required';
    else if (form.newPassword.length < 6) next.newPassword = 'At least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await authAPI.resetPassword(form);
      navigate('/login');
    } catch (err) {
      setApiError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Enter your reset token and new password"
      footer={<Link to="/login">Back to sign in</Link>}
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
          id="token"
          name="token"
          label="Reset token"
          placeholder="Paste your reset token"
          value={form.token}
          onChange={onChange}
          error={errors.token}
        />
        <Input
          id="newPassword"
          name="newPassword"
          label="New password"
          type="password"
          placeholder="At least 6 characters"
          value={form.newPassword}
          onChange={onChange}
          error={errors.newPassword}
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading} fullWidth>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
