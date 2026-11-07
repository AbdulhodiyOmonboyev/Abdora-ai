import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileBottomNav from './MobileBottomNav';

export default function MainLayout() {
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
    </div>
  );
}
