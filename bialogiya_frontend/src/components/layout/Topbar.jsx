import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Sun, Moon, LogOut, Globe, ChevronDown, Menu,
  KeyRound, User, Eye, EyeOff, Search, X, Check,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../config/axios';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils/format';

const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  reception: 'Qabulxona',
  teacher: "O'qituvchi",
  student: "O'quvchi",
};

const dropdownVariants = {
  hidden: { opacity: 0, y: 6, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, y: 4, scale: 0.97, transition: { duration: 0.1 } },
};

export default function Topbar({ onMenuClick }) {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showHeaderResults, setShowHeaderResults] = useState(false);

  const closeAll = () => { setShowNotifs(false); setShowLang(false); setShowProfile(false); };

  const searchPath = user?.role === 'admin'
    ? '/admin/branches'
    : user?.role === 'manager'
      ? '/manager/branches'
      : null;

  const searchPlaceholder = user?.role === 'manager'
    ? "Filial nomi bo'yicha qidirish"
    : "Markaz nomi bo'yicha qidirish";

  // Sync input with URL ?search= on back/forward navigation
  const urlSearch = searchPath && location.pathname.startsWith(searchPath)
    ? new URLSearchParams(location.search).get('search') || ''
    : null;
  const [syncedUrlSearch, setSyncedUrlSearch] = useState(urlSearch);
  if (urlSearch !== null && urlSearch !== syncedUrlSearch) {
    setSyncedUrlSearch(urlSearch);
    setHeaderSearch(urlSearch);
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(headerSearch.trim()), 250);
    return () => clearTimeout(timer);
  }, [headerSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowHeaderResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: headerUsers = [], isFetching: isHeaderSearching, isError: headerSearchFailed } = useQuery({
    queryKey: ['header-search-users', debouncedSearch],
    queryFn: () => api.get('/users', { params: { search: debouncedSearch, perPage: 10 } })
      .then(r => (Array.isArray(r.data?.data) ? r.data.data : [])),
    enabled: Boolean(debouncedSearch),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
  });

  const searchPending = isHeaderSearching || debouncedSearch !== headerSearch.trim();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchPath) return;
    const params = new URLSearchParams();
    if (headerSearch.trim()) params.set('search', headerSearch.trim());
    navigate(`${searchPath}${params.toString() ? `?${params.toString()}` : ''}`);
    setShowHeaderResults(false);
  };

  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/analytics/notifications').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const markRead = useMutation({
    mutationFn: () => api.put('/analytics/notifications/read'),
    onSuccess: () => refetch(),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => { clearAuth(); navigate('/login'); },
    onError: () => { clearAuth(); navigate('/login'); },
  });

  const changePwMutation = useMutation({
    mutationFn: (d) => api.post('/users/change-password', d),
    onSuccess: () => {
      toast.success('✅ Parol muvaffaqiyatli o\'zgartirildi!');
      setShowChangePw(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const handleChangePw = () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) return toast.error('Barcha maydonlarni to\'ldiring');
    if (pwForm.newPw.length < 6) return toast.error('Yangi parol kamida 6 ta belgi bo\'lishi kerak');
    if (pwForm.newPw !== pwForm.confirm) return toast.error('Yangi parollar mos kelmaydi');
    changePwMutation.mutate({ currentPassword: pwForm.current, newPassword: pwForm.newPw });
  };

  const notifications = notifData?.notifications || [];
  const unread = notifData?.unread || 0;

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('neyron-lang', lang);
    setShowLang(false);
  };

  const initials = (user?.name || 'U').charAt(0).toUpperCase();

  const pwStrength = pwForm.newPw.length >= 10 ? 4 : pwForm.newPw.length >= 8 ? 3 : pwForm.newPw.length >= 6 ? 2 : pwForm.newPw.length >= 2 ? 1 : 0;
  const strengthColors = ['bg-gray-200', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];

  return (
    <>
      <header className="app-topbar">
        {/* Left */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onMenuClick}
            className="btn-icon md:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <div className="hidden md:flex flex-col justify-center">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString(
                i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
                { weekday: 'long', month: 'long', day: 'numeric' }
              )}
            </span>
          </div>
        </div>

        {/* Center — Search */}
        {searchPath && (
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative mx-4">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" />
                <input
                  value={headerSearch}
                  onChange={(e) => {
                    setHeaderSearch(e.target.value);
                    setShowHeaderResults(Boolean(e.target.value.trim()));
                  }}
                  onFocus={() => setShowHeaderResults(Boolean(headerSearch.trim()))}
                  onKeyDown={(e) => e.key === 'Escape' && setShowHeaderResults(false)}
                  placeholder={searchPlaceholder}
                  className="input-field"
                  style={{ height: '2.375rem', fontSize: '0.8125rem' }}
                />
                {headerSearch && (
                  <button
                    type="button"
                    onClick={() => { setHeaderSearch(''); setShowHeaderResults(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>

            <AnimatePresence>
              {showHeaderResults && headerSearch.trim() && (
                <motion.div
                  {...{ initial: dropdownVariants.hidden, animate: dropdownVariants.visible, exit: dropdownVariants.exit }}
                  className="absolute left-0 right-0 top-full mt-1.5 dropdown-panel w-full max-h-80 overflow-y-auto z-50"
                >
                  {searchPending ? (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Qidirilmoqda...</div>
                  ) : headerSearchFailed ? (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--error)' }}>Qidiruvda xatolik yuz berdi.</div>
                  ) : headerUsers.length === 0 ? (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Hech narsa topilmadi.</div>
                  ) : (
                    headerUsers.slice(0, 8).map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => { setShowHeaderResults(false); navigate(`/users/${result.id}`); }}
                        className="dropdown-item w-full"
                      >
                        <div className="avatar avatar-sm" style={{ width: '2rem', height: '2rem', fontSize: '0.72rem', flexShrink: 0 }}>
                          {(result.name || result.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {result.name || "Noma'lum"}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                            @{result.username}{result.phone ? ` · ${result.phone}` : ''}
                          </div>
                        </div>
                        <span className="badge badge-gray text-[10px] flex-shrink-0">
                          {ROLE_LABELS[result.role] || result.role}
                        </span>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto">

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setShowLang(v => !v); }}
              className="btn-ghost btn-sm gap-1 hidden sm:inline-flex items-center"
            >
              <Globe size={15} />
              <span className="uppercase font-semibold text-xs">{i18n.language}</span>
              <ChevronDown size={11} />
            </button>
            <AnimatePresence>
              {showLang && (
                <motion.div
                  {...{ initial: dropdownVariants.hidden, animate: dropdownVariants.visible, exit: dropdownVariants.exit }}
                  className="absolute right-0 top-full mt-1.5 dropdown-panel w-32 py-1 z-50"
                >
                  {[{ code: 'uz', label: "O'zbek" }, { code: 'ru', label: 'Русский' }, { code: 'en', label: 'English' }].map(l => (
                    <button
                      key={l.code}
                      onClick={() => changeLanguage(l.code)}
                      className="dropdown-item"
                    >
                      {i18n.language === l.code && <Check size={13} style={{ color: 'var(--primary)' }} className="flex-shrink-0" />}
                      <span className={i18n.language === l.code ? 'font-semibold' : ''} style={i18n.language === l.code ? { color: 'var(--primary)' } : {}}>
                        {l.label}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="btn-icon"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark'
              ? <Sun size={17} style={{ color: '#F59E0B' }} />
              : <Moon size={17} style={{ color: 'var(--text-secondary)' }} />
            }
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                closeAll();
                setShowNotifs(v => !v);
                if (unread > 0) markRead.mutate();
              }}
              className="btn-icon relative"
              aria-label="Notifications"
            >
              <Bell size={17} style={{ color: 'var(--text-secondary)' }} />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  {...{ initial: dropdownVariants.hidden, animate: dropdownVariants.visible, exit: dropdownVariants.exit }}
                  className="absolute right-0 top-full mt-1.5 dropdown-panel w-72 sm:w-80 z-50"
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {t('notifications')}
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => markRead.mutate()}
                        className="text-xs font-medium hover:underline"
                        style={{ color: 'var(--primary)' }}
                      >
                        {t('mark_all_read')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {t('no_notifications')}
                      </div>
                    ) : notifications.map(n => (
                      <div
                        key={n.id}
                        className="px-4 py-3 transition-colors"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: !n.isRead ? 'rgba(240, 100, 19, 0.05)' : undefined,
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--secondary-background)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = !n.isRead ? 'rgba(240, 100, 19, 0.05)' : ''}
                      >
                        <div className="flex gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                            style={{ backgroundColor: 'var(--secondary-background)', border: '1px solid var(--border)' }}
                          >
                            {n.type === 'homework' ? '📚' : n.type === 'exam' ? '✍️' : n.type === 'achievement' ? '🏆' : '📌'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{n.title}</div>
                            <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{n.message}</div>
                            <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(n.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-0.5 hidden sm:block" style={{ backgroundColor: 'var(--border)' }} />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setShowProfile(v => !v); }}
              className="flex items-center gap-2 btn-ghost py-1.5 px-2 rounded-xl"
            >
              <div className="avatar avatar-sm" style={{ width: '1.875rem', height: '1.875rem', fontSize: '0.7rem' }}>
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start min-w-0">
                <span className="text-xs font-semibold truncate max-w-[90px] leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {user?.name}
                </span>
                <span className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
              <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} className="hidden sm:block flex-shrink-0" />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  {...{ initial: dropdownVariants.hidden, animate: dropdownVariants.visible, exit: dropdownVariants.exit }}
                  className="absolute right-0 top-full mt-1.5 dropdown-panel w-52 z-50 py-1.5"
                >
                  {/* User info */}
                  <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {user?.name}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>@{user?.username}</div>
                    <span className={`badge mt-1.5 ${
                      user?.role === 'teacher' ? 'badge-purple'
                      : user?.role === 'admin' ? 'badge-orange'
                      : user?.role === 'reception' ? 'badge-success'
                      : user?.role === 'manager' ? 'badge-info'
                      : 'badge-gray'
                    }`}>
                      {ROLE_LABELS[user?.role] || user?.role}
                    </span>
                    {user?.isFrozen && (
                      <div className="mt-1.5 text-xs" style={{ color: 'var(--info)' }}>❄️ Hisobingiz muzlatilgan</div>
                    )}
                  </div>

                  <button
                    onClick={() => { setShowProfile(false); navigate('/profile'); }}
                    className="dropdown-item"
                  >
                    <User size={14} style={{ color: 'var(--primary)' }} />
                    Mening profilim
                  </button>
                  <button
                    onClick={() => { setShowProfile(false); setShowChangePw(true); }}
                    className="dropdown-item"
                  >
                    <KeyRound size={14} style={{ color: 'var(--text-secondary)' }} />
                    Parolni o'zgartirish
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="dropdown-item danger"
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut size={14} />
                    {logoutMutation.isPending ? 'Chiqilmoqda...' : 'Chiqish'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Change Password Modal ── */}
      <AnimatePresence>
        {showChangePw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && setShowChangePw(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 8, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="modal-panel max-w-sm"
            >
              {/* Header */}
              <div className="modal-header">
                <div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'rgba(240, 100, 19, 0.1)', border: '1px solid rgba(240, 100, 19, 0.2)' }}
                  >
                    <KeyRound size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <h2 className="modal-title">Parolni o'zgartirish</h2>
                  <p className="modal-subtitle">Yangi parolingizni kiriting</p>
                </div>
                <button onClick={() => setShowChangePw(false)} className="btn-icon flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5">
                {/* Current password */}
                <div>
                  <label className="form-label">Joriy parol *</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="Hozirgi parolingiz"
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="form-label">Yangi parol *</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pwForm.newPw}
                      onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                      placeholder="Kamida 6 ta belgi"
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {pwForm.newPw && (
                    <div className="mt-1.5 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < pwStrength ? strengthColors[pwStrength] : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="form-label">Yangi parolni tasdiqlang *</label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Qaytadan kiriting"
                    className={`input-field ${pwForm.confirm && pwForm.newPw !== pwForm.confirm ? 'input-error' : ''}`}
                  />
                  {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                    <p className="form-error">Parollar mos kelmaydi</p>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => { setShowChangePw(false); setPwForm({ current: '', newPw: '', confirm: '' }); }}
                  className="btn-ghost"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleChangePw}
                  disabled={!pwForm.current || !pwForm.newPw || !pwForm.confirm || changePwMutation.isPending}
                  className="btn-primary"
                >
                  {changePwMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
