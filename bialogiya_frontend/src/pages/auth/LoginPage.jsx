import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import './login.css';

import { formatUzPhone } from '../../utils/formatPhone';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: ({ data }) => {
      const { user, accessToken, refreshToken } = data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.name}!`);
      if (user.role === 'student') navigate('/student/dashboard');
      else if (user.role === 'teacher') navigate('/teacher/dashboard');
      else if (user.role === 'reception') navigate('/reception/teachers');
      else if (user.role === 'manager') navigate('/manager/dashboard');
      else navigate('/admin/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || t('invalid_credentials')),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('Fill in all fields');
    loginMutation.mutate(form);
  };

  return (
    <main className="login-shell">
      <div className="login-orbit login-orbit-one" />
      <div className="login-orbit login-orbit-two" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="login-panel"
      >
        <div className="login-card">
          <a className="login-back" href="/"><ArrowLeft size={15} /> Bosh sahifaga qaytish</a>
          <div className="login-brand">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="login-logo"
            >
              <span>A</span>
            </motion.div>
            <p className="login-kicker">Abdora AI</p>
            <h1>{t('app_name')}</h1>
            <p>{t('tagline')}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>{t('username')}</label>
              <input
                type="text"
                value={form.username}
                onChange={e => {
                  const val = e.target.value;
                  if (/^\+?\d/.test(val)) {
                    setForm(f => ({ ...f, username: formatUzPhone(val) }));
                  } else {
                    setForm(f => ({ ...f, username: val }));
                  }
                }}
                placeholder="+998 (90) 200-20-20"
                className="login-input"
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label>Kod</label>
              <div className="login-password">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Telefon oxirgi 4 raqami"
                  className="login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="login-eye"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loginMutation.isPending}
              className="login-submit"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="login-spinner" />
                  {t('signing_in')}
                </span>
              ) : t('login')}
            </motion.button>
          </form>
          <div className="login-note"><LockKeyhole size={14} /> Hisobingiz xavfsiz himoyalangan</div>
        </div>
      </motion.div>
    </main>
  );
}
