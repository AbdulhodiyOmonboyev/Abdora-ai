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
import { LogoIcon } from '../../components/ui/Logo';
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
      toast.success(t('login_success') || 'Xush kelibsiz!');
      const role = user.role;
      if (role === 'admin' || role === 'owner') navigate('/owner/dashboard');
      else if (role === 'teacher') navigate('/teacher/dashboard');
      else if (role === 'student') navigate('/student/dashboard');
      else if (role === 'reception') navigate('/reception/dashboard');
      else navigate('/');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('login_failed') || 'Kirishda xatolik yuz berdi');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password.trim()) {
      toast.error(t('fill_required_fields') || 'Barcha maydonlarni to\'ldiring');
      return;
    }
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
          <a className="login-back text-gray-600 dark:text-gray-400" href="/">
            <ArrowLeft size={15} /> Bosh sahifaga qaytish
          </a>
          <div className="login-brand">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-3"
            >
              <LogoIcon size={76} />
            </motion.div>
            <p className="login-kicker">Abdora</p>
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
              <label>Parol / Kirish kodi</label>
              <div className="login-password">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="login-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="login-submit"
            >
              {loginMutation.isPending ? (
                <span className="login-spinner" />
              ) : (
                'Kirish'
              )}
            </button>
          </form>

          <div className="login-note">
            <LockKeyhole size={14} />
            <span>Xavfsiz va shifrlangan ulanish</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
