// theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // Cargar el tema al iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Primero intentar cargar el tema temporal de la sesión actual
        const sessionTheme = await AsyncStorage.getItem('sessionTheme');

        if (sessionTheme) {
          // Si hay tema temporal, usarlo
          setThemeState(sessionTheme as 'light' | 'dark');
        } else {
          // Si no hay tema temporal, cargar el tema guardado en preferencias
          const storedTheme = await AsyncStorage.getItem('darkMode');
          if (storedTheme !== null) {
            const isDark = JSON.parse(storedTheme);
            setThemeState(isDark ? 'dark' : 'light');
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadTheme();
  }, []);

  // Cambio TEMPORAL del tema (solo para la sesión actual)
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);

    // Guardar solo en sessionTheme, NO en darkMode
    try {
      await AsyncStorage.setItem('sessionTheme', newTheme);
    } catch (error) {
      console.error('Error saving session theme:', error);
    }
  };

  // Cambio PERMANENTE del tema (usado desde PreferencesScreen)
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    // Este método NO guarda en AsyncStorage, lo hace savePreferencesToBackend
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
