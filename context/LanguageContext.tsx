import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n'; // importa tu configuración de i18next

interface LanguageContextProps {
  language: 'en' | 'es' | 'ca';
  setLanguage: (lang: 'en' | 'es' | 'ca') => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'en' | 'es' | 'ca'>('en');

  // Cargar idioma guardado al inicio
  useEffect(() => {
    (async () => {
      const storedLang = await AsyncStorage.getItem('appLanguage');
      if (storedLang && ['en', 'es', 'ca'].includes(storedLang)) {
        setLanguage(storedLang as 'en' | 'es' | 'ca');
        i18n.changeLanguage(storedLang);
      }
    })();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};