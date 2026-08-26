const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const parseHex = (hex) => {
  const normalized = hex.replace('#', '').trim();
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;
  const int = parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

export const rgbToHex = (r, g, b) => `#${((1 << 24) + ((r & 255) << 16) + ((g & 255) << 8) + (b & 255)).toString(16).slice(1).toUpperCase()}`;

export const hexToRgb = (hex) => {
  if (!hex) return { r: 0, g: 0, b: 0 };
  return parseHex(hex);
};

export const rgbToHsl = ({ r, g, b }) => {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rr) h = ((gg - bb) / delta) % 6;
    else if (max === gg) h = (bb - rr) / delta + 2;
    else h = (rr - gg) / delta + 4;
  }

  return {
    h: (h * 60 + 360) % 360,
    s,
    l,
  };
};

export const hslToRgb = ({ h, s, l }) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rr;
  let gg;
  let bb;

  if (h < 60) {
    rr = c; gg = x; bb = 0;
  } else if (h < 120) {
    rr = x; gg = c; bb = 0;
  } else if (h < 180) {
    rr = 0; gg = c; bb = x;
  } else if (h < 240) {
    rr = 0; gg = x; bb = c;
  } else if (h < 300) {
    rr = x; gg = 0; bb = c;
  } else {
    rr = c; gg = 0; bb = x;
  }

  return {
    r: Math.round((rr + m) * 255),
    g: Math.round((gg + m) * 255),
    b: Math.round((bb + m) * 255),
  };
};

const adjustColor = (hex, amount) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(...Object.values(hslToRgb({
    h: hsl.h,
    s: clamp(hsl.s),
    l: clamp(hsl.l + amount),
  })));
};

export const lighten = (hex, amount = 0.08) => adjustColor(hex, Math.abs(amount));
export const darken = (hex, amount = 0.08) => adjustColor(hex, -Math.abs(amount));

export const mix = (hexA, hexB, weight = 0.5) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * weight),
    Math.round(a.g + (b.g - a.g) * weight),
    Math.round(a.b + (b.b - a.b) * weight),
  );
};

export const getLuminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const map = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * map(r) + 0.7152 * map(g) + 0.0722 * map(b);
};

export const getContrastRatio = (foreground, background) => {
  const l1 = getLuminance(foreground) + 0.05;
  const l2 = getLuminance(background) + 0.05;
  return Math.max(l1, l2) / Math.min(l1, l2);
};

export const getReadableTextColor = (background, light = '#FFFFFF', dark = '#111827') => {
  if (!background) return dark;
  const lightRatio = getContrastRatio(light, background);
  const darkRatio = getContrastRatio(dark, background);
  return lightRatio >= darkRatio ? light : dark;
};

export const isDarkColor = (hex) => getLuminance(hex) < 0.5;

export const generateScale = (base) => {
  return {
    50: lighten(base, 0.46),
    100: lighten(base, 0.34),
    200: lighten(base, 0.22),
    300: lighten(base, 0.1),
    400: lighten(base, 0.04),
    500: base,
    600: darken(base, 0.08),
    700: darken(base, 0.16),
    800: darken(base, 0.24),
    900: darken(base, 0.34),
  };
};

export const smartCardColor = (background) => {
  return isDarkColor(background)
    ? lighten(background, 0.08)
    : darken(background, 0.04);
};

export const smartShadowColor = (background) => {
  return isDarkColor(background)
    ? 'rgba(255,255,255,0.09)'
    : 'rgba(15,23,42,0.08)';
};

export const normalizeThemeValues = (values = {}) => {
  const defaultBackground = '#F8FAFC';
  const background = values.background || defaultBackground;
  const primary = values.primaryColor || '#00BFA6';
  const secondary = values.secondaryColor || '#0099FF';
  const accent = values.accentColor || '#7C3AED';
  const surface = values.surfaceColor || (isDarkColor(background) ? darken(background, 0.08) : lighten(background, 0.02));
  const card = values.cardBackground || smartCardColor(background);
  const button = values.buttonColor || primary;
  const buttonHover = values.buttonHover || (isDarkColor(button) ? lighten(button, 0.12) : darken(button, 0.1));
  const buttonText = values.buttonText || getReadableTextColor(button, '#FFFFFF', '#0F172A');
  const success = values.successColor || '#16A34A';
  const warning = values.warningColor || '#F59E0B';
  const error = values.errorColor || '#DC2626';
  const info = values.infoColor || '#0EA5E9';

  const textPrimary = values.textPrimary || getReadableTextColor(background, '#FFFFFF', '#0F172A');
  const textSecondary = values.textSecondary || (isDarkColor(background) ? lighten(textPrimary, 0.35) : darken(textPrimary, 0.35));
  const textMuted = values.textMuted || (isDarkColor(background) ? '#94A3B8' : '#6B7280');
  const border = values.borderColor || (isDarkColor(background) ? darken(background, 0.22) : lighten(background, 0.5));
  const divider = values.dividerColor || (isDarkColor(background) ? darken(background, 0.28) : lighten(background, 0.65));
  const inputBackground = values.inputBackground || (isDarkColor(background) ? darken(background, 0.08) : '#FFFFFF');
  const inputBorder = values.inputBorder || (isDarkColor(background) ? darken(background, 0.25) : '#CBD5E1');
  const secondaryBackground = values.secondaryBackground || surface;
  const navbarBackground = values.navbarBackground || background;
  const sidebarBackground = values.sidebarBackground || secondaryBackground;
  const footerBackground = values.footerBackground || secondaryBackground;

  return {
    background,
    secondaryBackground,
    cardBackground: card,
    surfaceColor: surface,
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accent,
    buttonColor: button,
    buttonHover,
    buttonText,
    textPrimary,
    textSecondary,
    textMuted,
    borderColor: border,
    dividerColor: divider,
    inputBackground,
    inputBorder,
    navbarBackground,
    sidebarBackground,
    footerBackground,
    successColor: success,
    warningColor: warning,
    errorColor: error,
    infoColor: info,
    shadowColor: values.shadowColor || smartShadowColor(background),
  };
};

export const buildThemeVars = (values = {}) => {
  const normalized = normalizeThemeValues(values);
  const primaryScale = generateScale(normalized.primaryColor);
  const secondaryScale = generateScale(normalized.secondaryColor);

  return {
    background: normalized.background,
    'secondary-background': normalized.secondaryBackground,
    card: normalized.cardBackground,
    surface: normalized.surfaceColor,
    primary: normalized.primaryColor,
    'primary-50': primaryScale[50],
    'primary-100': primaryScale[100],
    'primary-200': primaryScale[200],
    'primary-300': primaryScale[300],
    'primary-400': primaryScale[400],
    'primary-500': primaryScale[500],
    'primary-600': primaryScale[600],
    'primary-700': primaryScale[700],
    'primary-800': primaryScale[800],
    'primary-900': primaryScale[900],
    'primary-dark': darken(normalized.primaryColor, 0.12),
    secondary: normalized.secondaryColor,
    'secondary-50': secondaryScale[50],
    'secondary-100': secondaryScale[100],
    'secondary-200': secondaryScale[200],
    'secondary-300': secondaryScale[300],
    'secondary-400': secondaryScale[400],
    'secondary-500': secondaryScale[500],
    'secondary-600': secondaryScale[600],
    'secondary-700': secondaryScale[700],
    'secondary-800': secondaryScale[800],
    'secondary-900': secondaryScale[900],
    accent: normalized.accentColor,
    button: normalized.buttonColor,
    'button-hover': normalized.buttonHover,
    'button-text': normalized.buttonText,
    'text-primary': normalized.textPrimary,
    'text-secondary': normalized.textSecondary,
    'text-muted': normalized.textMuted,
    border: normalized.borderColor,
    divider: normalized.dividerColor,
    'input-bg': normalized.inputBackground,
    'input-border': normalized.inputBorder,
    'navbar-background': normalized.navbarBackground,
    'sidebar-background': normalized.sidebarBackground,
    'footer-background': normalized.footerBackground,
    success: normalized.successColor,
    warning: normalized.warningColor,
    error: normalized.errorColor,
    info: normalized.infoColor,
    shadow: normalized.shadowColor,
  };
};

export const applyThemeVars = (values = {}, mode = 'light') => {
  const themeVars = buildThemeVars(values);
  const root = document.documentElement;
  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  root.classList.toggle('dark', mode === 'dark');
  root.dataset.theme = mode;
};

const createTheme = ({ id, name, mode = 'light', values }) => ({

  id,
  name,
  mode,
  type: 'preset',
  values: normalizeThemeValues(values),
});

export const themePresets = [
  createTheme({
    id: 'preset-light',
    name: 'Light',
    mode: 'light',
    values: {
      background: '#F5F6F8',
      secondaryBackground: '#ECEEF2',
      cardBackground: '#FFFFFF',
      surfaceColor: '#F1F2F5',
      primaryColor: '#F06413',
      secondaryColor: '#2563EB',
      accentColor: '#EAB308',
      buttonColor: '#F06413',
      buttonHover: '#D9530B',
      buttonText: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      borderColor: '#E2E8F0',
      dividerColor: '#E2E8F0',
      inputBackground: '#FFFFFF',
      inputBorder: '#CBD5E1',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#F5F6F8',
      footerBackground: '#F5F6F8',
      successColor: '#16A34A',
      warningColor: '#F59E0B',
      errorColor: '#DC2626',
      infoColor: '#0EA5E9',
    },
  }),
  createTheme({
    id: 'preset-dark',
    name: 'Dark',
    mode: 'dark',
    values: {
      background: '#0B0F19',
      secondaryBackground: '#111722',
      cardBackground: '#202733',
      surfaceColor: '#171D28',
      primaryColor: '#F06413',
      secondaryColor: '#60A5FA',
      accentColor: '#EAB308',
      buttonColor: '#F06413',
      buttonHover: '#D9530B',
      buttonText: '#F8FAFC',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      borderColor: '#334155',
      dividerColor: '#2E3A50',
      inputBackground: '#111827',
      inputBorder: '#334155',
      navbarBackground: '#0B0F19',
      sidebarBackground: '#111722',
      footerBackground: '#111722',
      successColor: '#22C55E',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#38BDF8',
    },
  }),
  createTheme({
    id: 'preset-amoled',
    name: 'AMOLED',
    mode: 'amoled',
    values: {
      background: '#000000',
      secondaryBackground: '#080808',
      cardBackground: '#111111',
      surfaceColor: '#0A0A0A',
      primaryColor: '#5B8DEF',
      secondaryColor: '#22D3EE',
      accentColor: '#F472B6',
      buttonColor: '#5B8DEF',
      buttonHover: '#3B82F6',
      buttonText: '#FFFFFF',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      borderColor: '#242424',
      dividerColor: '#1F2937',
      inputBackground: '#111111',
      inputBorder: '#242424',
      navbarBackground: '#000000',
      sidebarBackground: '#080808',
      footerBackground: '#080808',
      successColor: '#22C55E',
      warningColor: '#FBBF24',
      errorColor: '#F97316',
      infoColor: '#38BDF8',
    },
  }),
  createTheme({
    id: 'preset-telegram',
    name: 'Telegram',
    mode: 'light',
    values: {
      background: '#E7F3FF',
      secondaryBackground: '#F5FBFF',
      cardBackground: '#FFFFFF',
      surfaceColor: '#F0F8FF',
      primaryColor: '#0088CC',
      secondaryColor: '#2EA0FF',
      accentColor: '#22C55E',
      buttonColor: '#0088CC',
      buttonHover: '#0077B6',
      buttonText: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#475569',
      textMuted: '#64748B',
      borderColor: '#D5E4F4',
      dividerColor: '#D5E4F4',
      inputBackground: '#FFFFFF',
      inputBorder: '#CBD5E1',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#E7F3FF',
      footerBackground: '#E7F3FF',
      successColor: '#22C55E',
      warningColor: '#F59E0B',
      errorColor: '#DC2626',
      infoColor: '#0EA5E9',
    },
  }),
  createTheme({
    id: 'preset-blue-ocean',
    name: 'Blue Ocean',
    mode: 'light',
    values: {
      background: '#EFF6FF',
      secondaryBackground: '#DBEAFE',
      cardBackground: '#FFFFFF',
      surfaceColor: '#F8FBFF',
      primaryColor: '#084298',
      secondaryColor: '#0EA5E9',
      accentColor: '#22C55E',
      buttonColor: '#084298',
      buttonHover: '#0B69D7',
      buttonText: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      borderColor: '#BFDBFE',
      dividerColor: '#93C5FD',
      inputBackground: '#FFFFFF',
      inputBorder: '#BFDBFE',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#EFF6FF',
      footerBackground: '#EFF6FF',
      successColor: '#16A34A',
      warningColor: '#F59E0B',
      errorColor: '#DC2626',
      infoColor: '#0EA5E9',
    },
  }),
  createTheme({
    id: 'preset-purple-neon',
    name: 'Purple Neon',
    mode: 'dark',
    values: {
      background: '#130B2F',
      secondaryBackground: '#1B0E3F',
      cardBackground: '#1F113F',
      surfaceColor: '#170E35',
      primaryColor: '#A855F7',
      secondaryColor: '#C084FC',
      accentColor: '#22D3EE',
      buttonColor: '#A855F7',
      buttonHover: '#9333EA',
      buttonText: '#FFFFFF',
      textPrimary: '#EDE9FE',
      textSecondary: '#C4B5FD',
      textMuted: '#A78BFA',
      borderColor: '#2D1B58',
      dividerColor: '#31225D',
      inputBackground: '#1E133F',
      inputBorder: '#2D1B58',
      navbarBackground: '#130B2F',
      sidebarBackground: '#1B0E3F',
      footerBackground: '#1B0E3F',
      successColor: '#22C55E',
      warningColor: '#F59E0B',
      errorColor: '#F43F5E',
      infoColor: '#38BDF8',
    },
  }),
  createTheme({
    id: 'preset-emerald',
    name: 'Emerald',
    mode: 'light',
    values: {
      background: '#ECFDF5',
      secondaryBackground: '#D1FAE5',
      cardBackground: '#FFFFFF',
      surfaceColor: '#F0FDF4',
      primaryColor: '#047857',
      secondaryColor: '#10B981',
      accentColor: '#059669',
      buttonColor: '#047857',
      buttonHover: '#065F46',
      buttonText: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#334155',
      textMuted: '#64748B',
      borderColor: '#A7F3D0',
      dividerColor: '#86EFAC',
      inputBackground: '#FFFFFF',
      inputBorder: '#D1FAE5',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#ECFDF5',
      footerBackground: '#ECFDF5',
      successColor: '#16A34A',
      warningColor: '#F59E0B',
      errorColor: '#DC2626',
      infoColor: '#22D3EE',
    },
  }),
  createTheme({
    id: 'preset-sunset',
    name: 'Sunset',
    mode: 'light',
    values: {
      background: '#FFF7ED',
      secondaryBackground: '#FFEDD5',
      cardBackground: '#FFFFFF',
      surfaceColor: '#FEF3C7',
      primaryColor: '#EA580C',
      secondaryColor: '#F97316',
      accentColor: '#F43F5E',
      buttonColor: '#EA580C',
      buttonHover: '#C2410C',
      buttonText: '#FFFFFF',
      textPrimary: '#1E293B',
      textSecondary: '#475569',
      textMuted: '#64748B',
      borderColor: '#FED7AA',
      dividerColor: '#FDBA74',
      inputBackground: '#FFFFFF',
      inputBorder: '#FCD34D',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#FFF7ED',
      footerBackground: '#FFF7ED',
      successColor: '#16A34A',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#0EA5E9',
    },
  }),
  createTheme({
    id: 'preset-rose',
    name: 'Rose',
    mode: 'light',
    values: {
      background: '#FFF1F2',
      secondaryBackground: '#FCE7F3',
      cardBackground: '#FFFFFF',
      surfaceColor: '#FDF2F8',
      primaryColor: '#BE185D',
      secondaryColor: '#F472B6',
      accentColor: '#FB7185',
      buttonColor: '#BE185D',
      buttonHover: '#9D174D',
      buttonText: '#FFFFFF',
      textPrimary: '#1F2937',
      textSecondary: '#475569',
      textMuted: '#6B7280',
      borderColor: '#FBCFE8',
      dividerColor: '#F9A8D4',
      inputBackground: '#FFFFFF',
      inputBorder: '#F9A8D4',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#FFF1F2',
      footerBackground: '#FFF1F2',
      successColor: '#22C55E',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#0EA5E9',
    },
  }),
  createTheme({
    id: 'preset-cyberpunk',
    name: 'Cyberpunk',
    mode: 'dark',
    values: {
      background: '#090A14',
      secondaryBackground: '#12132A',
      cardBackground: '#111126',
      surfaceColor: '#0F1021',
      primaryColor: '#7C3AED',
      secondaryColor: '#22D3EE',
      accentColor: '#F472B6',
      buttonColor: '#7C3AED',
      buttonHover: '#6D28D9',
      buttonText: '#F8FAFC',
      textPrimary: '#E2E8F0',
      textSecondary: '#A5B4FC',
      textMuted: '#94A3B8',
      borderColor: '#1F2937',
      dividerColor: '#374151',
      inputBackground: '#15162B',
      inputBorder: '#2D2F48',
      navbarBackground: '#090A14',
      sidebarBackground: '#12132A',
      footerBackground: '#12132A',
      successColor: '#22C55E',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#38BDF8',
    },
  }),
  createTheme({
    id: 'preset-minimal-gray',
    name: 'Minimal Gray',
    mode: 'light',
    values: {
      background: '#F8FAFC',
      secondaryBackground: '#F1F5F9',
      cardBackground: '#FFFFFF',
      surfaceColor: '#FFFFFF',
      primaryColor: '#334155',
      secondaryColor: '#64748B',
      accentColor: '#94A3B8',
      buttonColor: '#334155',
      buttonHover: '#1F2937',
      buttonText: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      borderColor: '#E2E8F0',
      dividerColor: '#E2E8F0',
      inputBackground: '#FFFFFF',
      inputBorder: '#CBD5E1',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#F8FAFC',
      footerBackground: '#F8FAFC',
      successColor: '#22C55E',
      warningColor: '#F59E0B',
      errorColor: '#DC2626',
      infoColor: '#0EA5E9',
    },
  }),
  createTheme({
    id: 'preset-github',
    name: 'GitHub',
    mode: 'light',
    values: {
      background: '#F6F8FA',
      secondaryBackground: '#FFFFFF',
      cardBackground: '#FFFFFF',
      surfaceColor: '#F6F8FA',
      primaryColor: '#0969DA',
      secondaryColor: '#1F6FEB',
      accentColor: '#238636',
      buttonColor: '#0969DA',
      buttonHover: '#0B66E0',
      buttonText: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#6B7280',
      borderColor: '#E1E4E8',
      dividerColor: '#D0D7DE',
      inputBackground: '#FFFFFF',
      inputBorder: '#D0D7DE',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#F6F8FA',
      footerBackground: '#F6F8FA',
      successColor: '#238636',
      warningColor: '#D69E2E',
      errorColor: '#BE123C',
      infoColor: '#1F6FEB',
    },
  }),
  createTheme({
    id: 'preset-discord',
    name: 'Discord',
    mode: 'dark',
    values: {
      background: '#0D1321',
      secondaryBackground: '#111827',
      cardBackground: '#111827',
      surfaceColor: '#111827',
      primaryColor: '#5865F2',
      secondaryColor: '#7289DA',
      accentColor: '#43B581',
      buttonColor: '#5865F2',
      buttonHover: '#4B61E1',
      buttonText: '#FFFFFF',
      textPrimary: '#E6EDF3',
      textSecondary: '#A5B4FC',
      textMuted: '#94A3B8',
      borderColor: '#1F2937',
      dividerColor: '#2D3748',
      inputBackground: '#111827',
      inputBorder: '#2D3748',
      navbarBackground: '#0D1321',
      sidebarBackground: '#111827',
      footerBackground: '#111827',
      successColor: '#43B581',
      warningColor: '#F59E0B',
      errorColor: '#F04747',
      infoColor: '#7289DA',
    },
  }),
  createTheme({
    id: 'preset-spotify',
    name: 'Spotify',
    mode: 'dark',
    values: {
      background: '#121212',
      secondaryBackground: '#181818',
      cardBackground: '#181818',
      surfaceColor: '#202020',
      primaryColor: '#1DB954',
      secondaryColor: '#1ED760',
      accentColor: '#1DB954',
      buttonColor: '#1DB954',
      buttonHover: '#17A44A',
      buttonText: '#FFFFFF',
      textPrimary: '#FFFFFF',
      textSecondary: '#B3B3B3',
      textMuted: '#7A7A7A',
      borderColor: '#282828',
      dividerColor: '#303030',
      inputBackground: '#181818',
      inputBorder: '#282828',
      navbarBackground: '#121212',
      sidebarBackground: '#181818',
      footerBackground: '#181818',
      successColor: '#1DB954',
      warningColor: '#F59E0B',
      errorColor: '#E63946',
      infoColor: '#22C55E',
    },
  }),
  createTheme({
    id: 'preset-nord',
    name: 'Nord',
    mode: 'dark',
    values: {
      background: '#2E3440',
      secondaryBackground: '#3B4252',
      cardBackground: '#3B4252',
      surfaceColor: '#434C5E',
      primaryColor: '#81A1C1',
      secondaryColor: '#88C0D0',
      accentColor: '#8FBCBB',
      buttonColor: '#81A1C1',
      buttonHover: '#5E81AC',
      buttonText: '#ECEFF4',
      textPrimary: '#ECEFF4',
      textSecondary: '#D8DEE9',
      textMuted: '#A3BE8C',
      borderColor: '#4C566A',
      dividerColor: '#434C5E',
      inputBackground: '#3B4252',
      inputBorder: '#4C566A',
      navbarBackground: '#2E3440',
      sidebarBackground: '#3B4252',
      footerBackground: '#3B4252',
      successColor: '#A3BE8C',
      warningColor: '#EBCB8B',
      errorColor: '#BF616A',
      infoColor: '#88C0D0',
    },
  }),
  createTheme({
    id: 'preset-dracula',
    name: 'Dracula',
    mode: 'dark',
    values: {
      background: '#0B1220',
      secondaryBackground: '#191A2A',
      cardBackground: '#1E2135',
      surfaceColor: '#1B1F33',
      primaryColor: '#8B5CF6',
      secondaryColor: '#F472B6',
      accentColor: '#38BDF8',
      buttonColor: '#8B5CF6',
      buttonHover: '#7C3AED',
      buttonText: '#F8FAFC',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      borderColor: '#2E2F49',
      dividerColor: '#313552',
      inputBackground: '#1E2135',
      inputBorder: '#2E2F49',
      navbarBackground: '#0B1220',
      sidebarBackground: '#191A2A',
      footerBackground: '#191A2A',
      successColor: '#22C55E',
      warningColor: '#FBBF24',
      errorColor: '#F43F5E',
      infoColor: '#38BDF8',
    },
  }),
  createTheme({
    id: 'preset-material',
    name: 'Material',
    mode: 'light',
    values: {
      background: '#F5F5F5',
      secondaryBackground: '#FFFFFF',
      cardBackground: '#FFFFFF',
      surfaceColor: '#F8F9FA',
      primaryColor: '#6200EE',
      secondaryColor: '#018786',
      accentColor: '#03DAC6',
      buttonColor: '#6200EE',
      buttonHover: '#4C00D1',
      buttonText: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#6B7280',
      borderColor: '#E5E7EB',
      dividerColor: '#D1D5DB',
      inputBackground: '#FFFFFF',
      inputBorder: '#D1D5DB',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#F5F5F5',
      footerBackground: '#F5F5F5',
      successColor: '#018786',
      warningColor: '#F59E0B',
      errorColor: '#B00020',
      infoColor: '#6200EE',
    },
  }),
  createTheme({
    id: 'preset-apple',
    name: 'Apple',
    mode: 'light',
    values: {
      background: '#F2F2F7',
      secondaryBackground: '#FFFFFF',
      cardBackground: '#FFFFFF',
      surfaceColor: '#F8F8F8',
      primaryColor: '#0A84FF',
      secondaryColor: '#32D74B',
      accentColor: '#BF5AF2',
      buttonColor: '#0A84FF',
      buttonHover: '#0060DF',
      buttonText: '#FFFFFF',
      textPrimary: '#1C1C1E',
      textSecondary: '#3C3C43',
      textMuted: '#6D6D72',
      borderColor: '#D1D1D6',
      dividerColor: '#E5E5EA',
      inputBackground: '#FFFFFF',
      inputBorder: '#D1D1D6',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#F2F2F7',
      footerBackground: '#F2F2F7',
      successColor: '#32D74B',
      warningColor: '#FFD60A',
      errorColor: '#FF3B30',
      infoColor: '#0A84FF',
    },
  }),
  createTheme({
    id: 'preset-windows-11',
    name: 'Windows 11',
    mode: 'light',
    values: {
      background: '#F3F3F3',
      secondaryBackground: '#FFFFFF',
      cardBackground: '#FFFFFF',
      surfaceColor: '#EFF1F3',
      primaryColor: '#0067C5',
      secondaryColor: '#2D7D9A',
      accentColor: '#0078D4',
      buttonColor: '#0067C5',
      buttonHover: '#0059A6',
      buttonText: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#6B7280',
      borderColor: '#D9D9D9',
      dividerColor: '#E5E7EB',
      inputBackground: '#FFFFFF',
      inputBorder: '#D9D9D9',
      navbarBackground: '#FFFFFF',
      sidebarBackground: '#F3F3F3',
      footerBackground: '#F3F3F3',
      successColor: '#107C10',
      warningColor: '#D29200',
      errorColor: '#D13438',
      infoColor: '#0078D4',
    },
  }),
];
