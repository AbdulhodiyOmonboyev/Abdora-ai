import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Sun, Moon, LogOut, Globe, ChevronDown, Menu,
  KeyRound, User, Eye, EyeOff, Search, X, Check,
  BookOpen, FileEdit, Trophy, Snowflake, Building2, Users2, GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useBranchStore } from '../../store/branchStore';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function Topbar({ onMenuClick, isSidebarOpen }) {
  const { user, clearAuth } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const { selectedBranchId, selectedBranchName, setSelectedBranch } = useBranchStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();

  // Refs for tracking outside clicks on all dropdowns
  const searchRef = useRef(null);
  const branchRef = useRef(null);
  const langRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showHeaderResults, setShowHeaderResults] = useState(false);

  const isManagement = ['admin', 'manager', 'reception'].includes(user?.role);

  const closeAll = () => {
    setShowNotifs(false);
    setShowLang(false);
    setShowProfile(false);
    setShowBranchDropdown(false);
  };

  // Dedicated toggle handlers that accurately invert state and close other open menus
  const toggleProfile = (e) => {
    e?.stopPropagation();
    const next = !showProfile;
    closeAll();
    setShowProfile(next);
  };

  const toggleNotifs = (e) => {
    e?.stopPropagation();
    const next = !showNotifs;
    closeAll();
    setShowNotifs(next);
  };

  const toggleLang = (e) => {
    e?.stopPropagation();
    const next = !showLang;
    closeAll();
    setShowLang(next);
  };

  const toggleBranchDropdown = (e) => {
    e?.stopPropagation();
    const next = !showBranchDropdown;
    closeAll();
    setShowBranchDropdown(next);
  };

  // Branches list for switcher
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ['header-branches', user?.role],
    queryFn: () => api.get('/admin/branches').then(r => (Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => []),
    enabled: Boolean(isManagement),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(headerSearch.trim()), 250);
    return () => clearTimeout(timer);
  }, [headerSearch]);

  // Handle outside clicks for ALL dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowHeaderResults(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target)) {
        setShowBranchDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLang(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAll();
        setShowHeaderResults(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns upon route navigation
  useEffect(() => {
    closeAll();
    setShowHeaderResults(false);
  }, [location.pathname]);

  // Global search: users
  const { data: headerUsers = [], isFetching: isHeaderSearching, isError: headerSearchFailed } = useQuery({
    queryKey: ['header-search-users', debouncedSearch, selectedBranchId],
    queryFn: () => api.get('/users', {
      params: {
        search: debouncedSearch,
        perPage: 8,
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      },
    }).then(r => (Array.isArray(r.data?.data) ? r.data.data : [])).catch(() => []),
    enabled: Boolean(debouncedSearch && isManagement),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 30,
  });

  // Global search: groups
  const { data: headerGroups = [] } = useQuery({
    queryKey: ['header-search-groups', debouncedSearch, selectedBranchId],
    queryFn: () => api.get('/groups', {
      params: {
        search: debouncedSearch,
        ...(selectedBranchId ? { branchId: selectedBranchId } : {}),
      },
    }).then(r => {
      const list = Array.isArray(r.data?.data) ? r.data.data : [];
      const q = debouncedSearch.toLowerCase();
      return list.filter(g => g.name?.toLowerCase().includes(q) || g.teacher?.name?.toLowerCase().includes(q)).slice(0, 4);
    }).catch(() => []),
    enabled: Boolean(debouncedSearch && isManagement),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 30,
  });

  const searchPending = isHeaderSearching || debouncedSearch !== headerSearch.trim();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!headerSearch.trim()) return;
    const q = encodeURIComponent(headerSearch.trim());
    if (user?.role === 'reception') {
      navigate(`/reception/students?search=${q}`);
    } else if (user?.role === 'manager') {
      navigate(`/manager/students?search=${q}`);
    } else {
      navigate(`/admin/students?search=${q}`);
    }
    setShowHeaderResults(false);
  };

  const handleSelectUser = (result) => {
    setShowHeaderResults(false);
    setHeaderSearch('');
    if (result.role === 'student') {
      navigate(user?.role === 'reception' ? `/reception/students/${result.id}` : `/admin/students/${result.id}`);
    } else if (result.role === 'teacher') {
      navigate(user?.role === 'reception' ? `/reception/teachers/${result.id}` : user?.role === 'manager' ? `/manager/teachers/${result.id}` : `/admin/teachers`);
    } else {
      navigate(`/users/${result.id}`);
    }
  };

  const handleSelectGroup = (group) => {
    setShowHeaderResults(false);
    setHeaderSearch('');
    if (user?.role === 'reception') {
      navigate(`/reception/groups/${group.id}`);
    } else if (user?.role === 'manager') {
      navigate(`/manager/groups/${group.id}`);
    } else {
      navigate(`/reception/groups/${group.id}`);
    }
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
    onSuccess: () => { qc.clear(); clearAuth(); navigate('/login'); },
    onError: () => { qc.clear(); clearAuth(); navigate('/login'); },
  });

  const changePwMutation = useMutation({
    mutationFn: (d) => api.post('/users/change-password', d),
    onSuccess: () => {
      toast.success('Parol muvaffaqiyatli o\'zgartirildi!');
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
            type="button"
            onClick={onMenuClick}
            className="btn-icon hover:bg-[var(--secondary-background)] transition-colors flex items-center justify-center"
            aria-label="Sidebarni ochish/yopish"
            title={isSidebarOpen ? "Sidebarni yopish" : "Sidebarni ochish"}
          >
            <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>

          <div className="hidden lg:flex flex-col justify-center">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString(
                i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US',
                { weekday: 'long', month: 'long', day: 'numeric' }
              )}
            </span>
          </div>
        </div>

        {/* Branch Filter / Switcher */}
        {isManagement && (
          <div ref={branchRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={toggleBranchDropdown}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--secondary-background)] text-[var(--text-primary)] transition-all text-xs font-medium shadow-sm hover:border-[var(--primary)] group"
              title="Filialni tanlash / almashtirish"
            >
              <Building2 size={14} className="text-[var(--primary)] flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="max-w-[100px] sm:max-w-[150px] truncate font-medium">
                {selectedBranchName || "Barcha filiallar"}
              </span>
              <ChevronDown size={12} className={`text-[var(--text-muted)] transition-transform duration-200 ${showBranchDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showBranchDropdown && (
                <motion.div
                  {...{ initial: dropdownVariants.hidden, animate: dropdownVariants.visible, exit: dropdownVariants.exit }}
                  className="absolute left-0 top-full mt-2 dropdown-panel w-64 max-w-[calc(100vw-2rem)] py-1.5 z-50 shadow-xl border border-[var(--border)]"
                >
                  <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={12} />
                      Filial tanlash
                    </span>
                    {selectedBranchId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBranch('', 'Barcha filiallar');
                          setShowBranchDropdown(false);
                          toast.success("Barcha filiallar ko'rinishi faollashdi");
                        }}
                        className="text-[10px] text-[var(--primary)] hover:underline capitalize"
                      >
                        Barchasi
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranch('', 'Barcha filiallar');
                        setShowBranchDropdown(false);
                        toast.success("Barcha filiallar tanlandi");
                      }}
                      className={`dropdown-item w-full flex items-center justify-between text-xs py-2 px-3 ${
                        !selectedBranchId ? 'bg-[var(--primary-50)] text-[var(--primary)] font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe size={14} className={!selectedBranchId ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'} />
                        <span>Barcha filiallar</span>
                      </div>
                      {!selectedBranchId && <Check size={14} className="text-[var(--primary)]" />}
                    </button>

                    {isLoadingBranches ? (
                      <div className="px-4 py-3 text-xs text-center text-[var(--text-muted)]">Yuklanmoqda...</div>
                    ) : branches.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-center text-[var(--text-muted)]">Filiallar topilmadi</div>
                    ) : (
                      branches.map((b) => {
                        const isSelected = selectedBranchId === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBranch(b.id, b.name);
                              setShowBranchDropdown(false);
                              toast.success(`${b.name} filialiga o'tildi`);
                            }}
                            className={`dropdown-item w-full flex items-center justify-between text-xs py-2 px-3 ${
                              isSelected ? 'bg-[var(--primary-50)] text-[var(--primary)] font-semibold' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <Building2 size={14} className={isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)] flex-shrink-0'} />
                              <div className="truncate text-left">
                                <div className="truncate">{b.name}</div>
                                {b.address && (
                                  <div className="text-[10px] text-[var(--text-muted)] truncate">{b.address}</div>
                                )}
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-[var(--primary)] flex-shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Center — Global Search */}
        {isManagement && (
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-md lg:max-w-lg relative mx-2">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="search-input-wrap relative w-full">
                <Search size={16} className="search-icon" />
                <input
                  value={headerSearch}
                  onChange={(e) => {
                    setHeaderSearch(e.target.value);
                    setShowHeaderResults(Boolean(e.target.value.trim()));
                  }}
                  onFocus={() => setShowHeaderResults(Boolean(headerSearch.trim()))}
                  onKeyDown={(e) => e.key === 'Escape' && setShowHeaderResults(false)}
                  placeholder="Qidirish (ism, telefon, guruh)..."
                  className="input-field h-9 text-xs sm:text-sm pl-9 pr-8"
                />
                {headerSearch && (
                  <button
                    type="button"
                    onClick={() => { setHeaderSearch(''); setShowHeaderResults(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                  className="absolute left-0 right-0 top-full mt-2 dropdown-panel w-full max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto z-50 shadow-2xl border border-[var(--border)] divide-y divide-[var(--border)]"
                >
                  {searchPending ? (
                    <div className="px-4 py-3 text-sm text-[var(--text-secondary)]">Qidirilmoqda...</div>
                  ) : headerSearchFailed ? (
                    <div className="px-4 py-3 text-sm text-[var(--error)]">Qidiruvda xatolik yuz berdi.</div>
                  ) : headerUsers.length === 0 && headerGroups.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--text-secondary)]">Hech narsa topilmadi.</div>
                  ) : (
                    <>
                      {/* Groups results */}
                      {headerGroups.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--secondary-background)]">
                            Guruhlar ({headerGroups.length})
                          </div>
                          {headerGroups.map((g) => (
                            <button
                              key={`grp-${g.id}`}
                              type="button"
                              onClick={() => handleSelectGroup(g)}
                              className="dropdown-item w-full flex items-center gap-3 py-2 px-3 text-left hover:bg-[var(--secondary-background)]"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[var(--primary-50)] text-[var(--primary)] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                <Users2 size={15} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs text-[var(--text-primary)] truncate">{g.name}</div>
                                <div className="text-[11px] text-[var(--text-muted)] truncate">
                                  {g.teacher?.name ? `Ustoz: ${g.teacher.name}` : ''}
                                  {g.branch?.name ? ` · ${g.branch.name}` : ''}
                                </div>
                              </div>
                              <span className="badge badge-primary text-[10px] flex-shrink-0">Guruh</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Users results */}
                      {headerUsers.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--secondary-background)]">
                            Foydalanuvchilar ({headerUsers.length})
                          </div>
                          {headerUsers.map((result) => (
                            <button
                              key={`usr-${result.id}`}
                              type="button"
                              onClick={() => handleSelectUser(result)}
                              className="dropdown-item w-full flex items-center gap-3 py-2 px-3 text-left hover:bg-[var(--secondary-background)]"
                            >
                              <div className="avatar avatar-sm flex-shrink-0" style={{ width: '2rem', height: '2rem', fontSize: '0.72rem' }}>
                                {(result.name || result.username || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                                  {result.name || "Noma'lum"}
                                </div>
                                <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                                  @{result.username}{result.phone ? ` · ${result.phone}` : ''}
                                </div>
                              </div>
                              <span className="badge badge-gray text-[10px] flex-shrink-0">
                                {ROLE_LABELS[result.role] || result.role}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto">

          {/* Language */}
          <div className="relative" ref={langRef}>
            <button
              onClick={toggleLang}
              className="btn-ghost btn-sm gap-1 hidden sm:inline-flex items-center"
            >
              <Globe size={15} />
              <span className="uppercase font-semibold text-xs">{i18n.language}</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${showLang ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showLang && (
                <motion.div
                  {...{ initial: dropdownVariants.hidden, animate: dropdownVariants.visible, exit: dropdownVariants.exit }}
                  className="absolute right-0 top-full mt-2 dropdown-panel w-36 max-w-[calc(100vw-2rem)] py-1 z-50 shadow-xl border border-[var(--border)]"
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
          <div className="relative" ref={notifRef}>
            <button
              onClick={toggleNotifs}
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
                  className="absolute right-0 top-full mt-2 dropdown-panel w-72 sm:w-80 max-w-[calc(100vw-2rem)] z-50 shadow-xl border border-[var(--border)]"
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
                            {n.type === 'homework' ? <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                              : n.type === 'exam' ? <FileEdit size={14} className="text-purple-500" />
                              : n.type === 'achievement' ? <Trophy size={14} className="text-amber-500" />
                              : <Bell size={14} style={{ color: 'var(--text-muted)' }} />}
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
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={toggleProfile}
              className="flex items-center gap-2 btn-ghost py-1.5 px-2 rounded-xl transition-colors hover:bg-[var(--secondary-background)]"
              aria-expanded={showProfile}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-[var(--primary)] text-white shadow-xs flex-shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start min-w-0">
                <span className="text-xs font-semibold truncate max-w-[110px] leading-tight text-[var(--text-primary)]">
                  {user?.name}
                </span>
                <span className="text-[10px] leading-tight text-[var(--text-muted)]">
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
              <ChevronDown size={13} className={`text-[var(--text-muted)] hidden sm:block flex-shrink-0 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  {...{ initial: dropdownVariants.hidden, animate: dropdownVariants.visible, exit: dropdownVariants.exit }}
                  className="absolute right-0 top-full mt-2 dropdown-panel w-56 max-w-[calc(100vw-2rem)] z-50 py-1.5 shadow-xl border border-[var(--border)]"
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
                      <div className="mt-1.5 text-xs flex items-center gap-1.5" style={{ color: 'var(--info)' }}>
                        <Snowflake size={12} className="text-sky-500" />
                        <span>Hisobingiz muzlatilgan</span>
                      </div>
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
