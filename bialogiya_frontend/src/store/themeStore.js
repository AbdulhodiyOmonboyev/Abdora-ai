import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { themePresets, normalizeThemeValues, applyThemeVars } from '../utils/themeUtils';

const STORAGE_KEY = 'neyron-theme';
const defaultTheme = themePresets[0];

const getThemeById = (state, id) => {
  return state.savedThemes.find((theme) => theme.id === id)
    || themePresets.find((theme) => theme.id === id)
    || defaultTheme;
};

const ensureTheme = (theme) => ({
  ...theme,
  values: normalizeThemeValues(theme.values),
});

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: defaultTheme.mode,
      activeThemeId: defaultTheme.id,
      savedThemes: [],
      init: () => {
        const state = get();
        const activeTheme = getThemeById(state, state.activeThemeId);
        const normalized = ensureTheme(activeTheme);
        set({ theme: normalized.mode, activeThemeId: normalized.id });
        applyThemeVars(normalized.values, normalized.mode);
      },
      toggle: () => {
        set((state) => {
          const currentTheme = getThemeById(state, state.activeThemeId);
          const nextMode = currentTheme.mode === 'dark' ? 'light' : 'dark';

          if (currentTheme.type === 'custom') {
            const updatedThemes = state.savedThemes.map((theme) =>
              theme.id === currentTheme.id ? { ...theme, mode: nextMode } : theme
            );

            applyThemeVars(currentTheme.values, nextMode);
            return {
              savedThemes: updatedThemes,
              theme: nextMode,
            };
          }

          const presetId = nextMode === 'dark' ? 'preset-dark' : 'preset-light';
          const nextTheme = getThemeById(state, presetId);
          const normalized = ensureTheme(nextTheme);
          applyThemeVars(normalized.values, normalized.mode);
          return {
            activeThemeId: normalized.id,
            theme: normalized.mode,
          };
        });
      },
      applyTheme: (id) => {
        set((state) => {
          const nextTheme = getThemeById(state, id);
          const normalized = ensureTheme(nextTheme);
          applyThemeVars(normalized.values, normalized.mode);
          return {
            activeThemeId: normalized.id,
            theme: normalized.mode,
          };
        });
      },
      createCustomTheme: (name, values, mode = 'light') => {
        const id = `custom-${Date.now()}`;
        const theme = {
          id,
          name,
          mode,
          type: 'custom',
          values: normalizeThemeValues(values),
        };
        set((state) => ({
          savedThemes: [...state.savedThemes, theme],
          activeThemeId: id,
          theme: mode,
        }));
        applyThemeVars(theme.values, theme.mode);
      },
      updateTheme: (id, values) => {
        set((state) => ({
          savedThemes: state.savedThemes.map((theme) =>
            theme.id === id ? { ...theme, values: normalizeThemeValues(values) } : theme
          ),
        }));
        const current = get().activeThemeId;
        if (current === id) {
          applyThemeVars(values, get().theme);
        }
      },
      renameTheme: (id, name) => {
        set((state) => ({
          savedThemes: state.savedThemes.map((theme) =>
            theme.id === id ? { ...theme, name } : theme
          ),
        }));
      },
      duplicateTheme: (id) => {
        const source = getThemeById(get(), id);
        const duplicate = {
          ...ensureTheme(source),
          id: `custom-${Date.now()}`,
          name: `${source.name} copy`,
          type: 'custom',
        };
        set((state) => ({
          savedThemes: [...state.savedThemes, duplicate],
          activeThemeId: duplicate.id,
          theme: duplicate.mode,
        }));
        applyThemeVars(duplicate.values, duplicate.mode);
      },
      deleteTheme: (id) => {
        set((state) => ({
          savedThemes: state.savedThemes.filter((theme) => theme.id !== id),
        }));
        if (get().activeThemeId === id) {
          const fallback = defaultTheme;
          applyThemeVars(fallback.values, fallback.mode);
          set({ activeThemeId: fallback.id, theme: fallback.mode });
        }
      },
      resetTheme: () => {
        set({
          activeThemeId: defaultTheme.id,
          theme: defaultTheme.mode,
        });
        applyThemeVars(defaultTheme.values, defaultTheme.mode);
      },
      importTheme: (payload) => {
        const raw = Array.isArray(payload) ? payload[0] : payload;
        if (!raw || !raw.id || !raw.name || !raw.values) return;
        const normalized = {
          ...raw,
          id: `custom-${Date.now()}`,
          name: raw.name,
          type: 'custom',
          values: normalizeThemeValues(raw.values),
          mode: raw.mode || 'light',
        };
        set((state) => ({ savedThemes: [...state.savedThemes, normalized], activeThemeId: normalized.id, theme: normalized.mode }));
        applyThemeVars(normalized.values, normalized.mode);
      },
      exportTheme: (id) => {
        const theme = getThemeById(get(), id);
        return JSON.stringify({ ...theme, type: 'custom' }, null, 2);
      },
      savedThemeList: () => [...themePresets, ...get().savedThemes],
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        theme: state.theme,
        activeThemeId: state.activeThemeId,
        savedThemes: state.savedThemes,
      }),
    }
  )
);
