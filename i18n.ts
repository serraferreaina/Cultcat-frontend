import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import ca from './locales/ca/translation.json';
//import * as RNLocalize from 'react-native-localize';

const resources = {
  en: { translation: en },
  es: { translation: es },
  ca: { translation: ca },
};

// Get device language
//const locales = RNLocalize.getLocales();
const languageTag = 'ca';

i18n.use(initReactI18next).init({
  resources,
  lng: languageTag,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // react already escapes
  },
});

export default i18n;
