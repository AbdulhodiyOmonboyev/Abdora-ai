import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../config/axios';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';
import HeroCreationModal from '../hero/HeroCreationModal';
import FloatingBuddy from '../hero/FloatingBuddy';
import CareerRoomModal from '../hero/CareerRoomModal';

export default function MainLayout() {
  const { user } = useAuthStore();
  const isStudent = user?.role === 'student';
  const queryClient = useQueryClient();

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [heroCreationOpen, setHeroCreationOpen] = useState(false);

  const { data: heroData } = useQuery({
    queryKey: ['myHero'],
    queryFn: () => api.get('/student/hero/me').then(r => r.data.data),
    enabled: isStudent,
    staleTime: 60000,
  });

  const hero = heroData?.hero || user?.heroConfig;
  const isFeynmanAllowed = heroData?.isFeynmanAllowed !== false;
  const isConfigured = heroData?.isConfigured || Boolean(hero?.isSetupCompleted);

  useEffect(() => {
    if (isStudent && heroData && isFeynmanAllowed && !isConfigured) {
      setHeroCreationOpen(true);
    }
  }, [isStudent, heroData, isFeynmanAllowed, isConfigured]);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_open');
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 768;
    }
    return true;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar_open', String(next)); } catch { /* ignore storage error */ }
      return next;
    });
  };

  const closeMobileSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(false);
      try { localStorage.setItem('sidebar_open', 'false'); } catch { /* ignore storage error */ }
    }
  };

  return (
    <div className="app-shell">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={closeMobileSidebar}
          />
        )}
      </AnimatePresence>

      <Sidebar isOpen={sidebarOpen} onClose={closeMobileSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
        <main className="app-main pb-20 md:pb-6">
          <Outlet />
        </main>
        {/* Mobile bottom navigation bar */}
        <MobileBottomNav onMoreClick={toggleSidebar} />
      </div>

      {/* Hero / Avatar Companion System for Students */}
      {isStudent && isFeynmanAllowed && (
        <>
          <FloatingBuddy
            hero={hero}
            onOpenRoom={() => setRoomModalOpen(true)}
          />
          <CareerRoomModal
            isOpen={roomModalOpen}
            onClose={() => setRoomModalOpen(false)}
            hero={hero}
          />
          <HeroCreationModal
            isOpen={heroCreationOpen}
            onClose={() => setHeroCreationOpen(false)}
            availableRaces={heroData?.availableRaces || []}
            onHeroCreated={() => queryClient.invalidateQueries(['myHero'])}
          />
        </>
      )}
    </div>
  );
}
