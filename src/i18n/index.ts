import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

const resources = {
  es: { translation: es },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const changeLanguage = (lang: 'es' | 'en') => {
  i18n.changeLanguage(lang);
  localStorage.setItem('sge_language', lang);
};

export const getCurrentLanguage = () => {
  return localStorage.getItem('sge_language') || 'es';
};
