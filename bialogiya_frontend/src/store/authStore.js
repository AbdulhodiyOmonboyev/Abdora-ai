import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setLanguage } from '../config/i18n';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        try {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        } catch (err) {
          console.warn('Unable to persist auth tokens', err);
        }
        if (user?.language) {
          setLanguage(user.language);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      updateUser: (updates) => set((state) => {
        const nextUser = state.user ? { ...state.user, ...updates } : updates;
        if (updates?.language) {
          setLanguage(updates.language);
        }
        return { user: nextUser };
      }),

      clearAuth: () => {
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('admin_settings_tab');
        } catch (err) {
          console.warn('Unable to clear auth tokens', err);
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'neyron-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
