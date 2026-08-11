import { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Upload,
  Trash2,
  Copy,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { themePresets, applyThemeVars } from '../../utils/themeUtils';

const fields = [
  { key: 'background', label: 'Background' },
  { key: 'secondaryBackground', label: 'Secondary Background' },
  { key: 'cardBackground', label: 'Card Background' },
  { key: 'surfaceColor', label: 'Surface Color' },
  { key: 'primaryColor', label: 'Primary Color' },
  { key: 'secondaryColor', label: 'Secondary Color' },
  { key: 'accentColor', label: 'Accent Color' },
  { key: 'buttonColor', label: 'Button Color' },
  { key: 'buttonHover', label: 'Button Hover' },
  { key: 'buttonText', label: 'Button Text' },
  { key: 'textPrimary', label: 'Text Primary' },
  { key: 'textSecondary', label: 'Text Secondary' },
  { key: 'textMuted', label: 'Text Muted' },
  { key: 'borderColor', label: 'Border Color' },
  { key: 'dividerColor', label: 'Divider Color' },
  { key: 'inputBackground', label: 'Input Background' },
  { key: 'inputBorder', label: 'Input Border' },
  { key: 'navbarBackground', label: 'Navbar Background' },
  { key: 'sidebarBackground', label: 'Sidebar Background' },
  { key: 'footerBackground', label: 'Footer Background' },
  { key: 'successColor', label: 'Success Color' },
  { key: 'warningColor', label: 'Warning Color' },
  { key: 'errorColor', label: 'Error Color' },
  { key: 'infoColor', label: 'Info Color' },
];

const getThemeList = (savedThemes) => [...themePresets, ...savedThemes];

export default function ThemeBuilder() {
  const {
    savedThemes,
    activeThemeId,
    applyTheme,
    createCustomTheme,
    updateTheme,
    renameTheme,
    duplicateTheme,
    deleteTheme,
    resetTheme,
    importTheme,
    exportTheme,
  } = useThemeStore();

  const themes = useMemo(() => getThemeList(savedThemes), [savedThemes]);
  const activeTheme = useMemo(() => themes.find((theme) => theme.id === activeThemeId) || themes[0], [themes, activeThemeId]);
  const [editingValues, setEditingValues] = useState(activeTheme.values);
  const [themeName, setThemeName] = useState(activeTheme.name);
  const [importJson, setImportJson] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const isCustom = activeTheme.type === 'custom';

  useEffect(() => {
    setEditingValues(prev => (prev === activeTheme.values ? prev : activeTheme.values));
    setThemeName(prev => (prev === activeTheme.name ? prev : activeTheme.name));
    applyTheme(activeTheme.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTheme.id]);

  useEffect(() => {
    applyThemeVars(editingValues, activeTheme.mode);
  }, [editingValues, activeTheme.mode]);

  const handleThemeSelect = (id) => applyTheme(id);

  const handleFieldChange = (key, value) => {
    const normalized = value.startsWith('#') ? value : `#${value}`;
    setEditingValues((current) => ({ ...current, [key]: normalized }));
    setPreviewKey((val) => val + 1);
  };

  const handleSave = () => {
    if (!themeName.trim()) return;
    if (isCustom) {
      updateTheme(activeTheme.id, editingValues);
      renameTheme(activeTheme.id, themeName.trim());
      return;
    }
    createCustomTheme(themeName.trim() || 'Custom theme', editingValues, activeTheme.mode);
  };

  const handleDuplicate = () => duplicateTheme(activeTheme.id);
  const handleDelete = () => deleteTheme(activeTheme.id);
  const handleReset = () => resetTheme();

  const handleExport = () => {
    const raw = exportTheme(activeTheme.id);
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTheme.name.replace(/\s+/g, '-') || 'theme'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      importTheme(parsed);
      setImportJson('');
    } catch {
      window.alert('JSON format noto‘g‘ri. Iltimos, to‘g‘ri JSON joylashtiring.');
    }
  };

  return (
    <div className="card w-full max-w-[1000px] mx-auto px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-full xl:max-w-[65%]">
            <div className="text-lg font-bold text-gray-800 dark:text-white">Theme Builder</div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-full xl:max-w-3xl">
              Create, preview, and save custom themes in the profile section. Color changes update instantly without page refresh.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button type="button" onClick={handleReset} className="btn-secondary w-full sm:w-[100px]">
              <RefreshCw size={16} /> Reset Theme
            </button>
            <button type="button" onClick={handleExport} className="btn-primary w-full sm:w-[100px]">
              <Download size={16} /> Export JSON
            </button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr]">
          <section className="space-y-4 rounded-3xl border border-divider bg-secondary-background p-4 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-gray-800 dark:text-white">Presets & Saved Themes</div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Live</span>
            </div>
            <div className="grid gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full rounded-3xl border p-4 text-left transition-all duration-200 ${theme.id === activeTheme.id ? 'border-primary bg-primary/10 shadow-soft' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'}`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-gray-800 dark:text-white">{theme.name}</span>
                      {theme.type === 'custom' && <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Custom</span>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['background', 'primaryColor', 'secondaryColor', 'accentColor'].map((key) => (
                        <span key={key} className="h-8 w-8 rounded-full border border-white shadow-sm" style={{ backgroundColor: theme.values[key] }} />
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Custom theme name</label>
              <input
                value={themeName}
                onChange={(event) => setThemeName(event.target.value)}
                className="input-field"
                placeholder="Theme name"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={handleSave} className="btn-primary flex-1 gap-2 inline-flex items-center justify-center w-full">
                  <Check size={16} /> {isCustom ? 'Save Changes' : 'Save Custom Theme'}
                </button>
                <button type="button" onClick={handleDuplicate} className="btn-ghost gap-2 inline-flex items-center justify-center w-full">
                  <Copy size={16} /> Duplicate
                </button>
                {isCustom && (
                  <button type="button" onClick={handleDelete} className="btn-ghost text-red-500 border border-red-200 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30 gap-2 inline-flex items-center justify-center w-full">
                    <Trash2 size={16} /> Delete
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-[var(--divider)]">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Import theme JSON</label>
              <textarea
                value={importJson}
                onChange={(event) => setImportJson(event.target.value)}
                rows={5}
                className="input-field resize-none"
                placeholder="Paste exported theme JSON here"
              />
              <button type="button" onClick={handleImport} className="btn-secondary gap-2 inline-flex items-center justify-center w-full">
                <Upload size={16} /> Import Theme
              </button>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[var(--divider)] bg-[var(--secondary-background)] p-4 min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-gray-800 dark:text-white">Custom Colors</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Change any color and watch the preview update instantly.</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                {activeTheme.mode.toUpperCase()}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {fields.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingValues[field.key] || '#000000'}
                      onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      className="h-11 w-14 rounded-xl border border-gray-200 p-0"
                    />
                    <input
                      type="text"
                      value={editingValues[field.key] || ''}
                      onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className="rounded-3xl border border-[var(--divider)] bg-[var(--background)] p-4 shadow-soft transition-all duration-200">
              <div className="flex items-center justify-between pb-4">
                <div className="font-semibold text-gray-800 dark:text-white">Live Preview</div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Smooth 200ms updates</span>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-[var(--divider)] bg-[var(--navbar-background)] p-4 text-[var(--text-primary)] shadow-sm transition-all duration-200" key={previewKey}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Navbar</div>
                    <button type="button" className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">Menu</button>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                  <aside className="rounded-3xl border border-[var(--divider)] bg-[var(--sidebar-background)] p-4 text-[var(--text-primary)] shadow-sm transition-all duration-200">
                    <div className="mb-4 flex items-center gap-2 text-sm font-semibold">Sidebar</div>
                    <div className="space-y-2">
                      <div className="h-10 rounded-2xl bg-[var(--button)]/10" />
                      <div className="h-10 rounded-2xl bg-[var(--button)]/10" />
                      <div className="h-10 rounded-2xl bg-[var(--button)]/10" />
                    </div>
                  </aside>
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-[var(--divider)] bg-[var(--card)] p-4 text-[var(--text-primary)] shadow-sm transition-all duration-200">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">Card</div>
                        <span className="rounded-full bg-[var(--secondary-background)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">Card</span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--text-secondary)]">This card always contrasts with the page background.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button className="btn-primary">Primary</button>
                      <button className="btn-secondary">Secondary</button>
                      <button className="btn-ghost">Ghost</button>
                    </div>
                    <div className="space-y-3">
                      <input className="input-field" placeholder="Input field" value="" readOnly />
                      <div className="h-12 rounded-2xl border border-[var(--divider)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-secondary)]">Preview input</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
