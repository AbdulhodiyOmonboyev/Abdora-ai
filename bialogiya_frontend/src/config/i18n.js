import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import languages from './languages.json';

// Dynamically load all translation.json files under src/locales/*
const modules = import.meta.glob('../locales/*/translation.json', { eager: true });

const resources = Object.keys(modules).reduce((acc, path) => {
  const match = path.match(/\/locales\/([^/]+)\/translation\.json$/);
  if (!match) return acc;
  const code = match[1];
  acc[code] = { translation: modules[path].default || modules[path] };
  return acc;
}, {});

const defaultLang = localStorage.getItem('neyron-lang') || (languages[0] && languages[0].code) || 'uz';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLang,
  fallbackLng: (languages[0] && languages[0].code) || 'uz',
  interpolation: { escapeValue: false },
});

export function setLanguage(code) {
  if (!code) return;
  const targetCode = resources[code] ? code : 'uz';
  i18n.changeLanguage(targetCode);
  try {
    localStorage.setItem('neyron-lang', targetCode);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = targetCode;
    }
  } catch (err) {
    console.warn('Unable to persist language to localStorage', err);
  }
}

export function getAvailableLanguages() {
  return languages;
}

export default i18n;
