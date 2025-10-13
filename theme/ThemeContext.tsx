import React, { createContext, useState, useContext, ReactNode } from 'react';

export type ThemeType = 'light' | 'dark' | null;

interface ThemeContextType {
  theme: ThemeType;
  setTheme: React.Dispatch<React.SetStateAction<ThemeType>>; // <-- allow function updates
}

const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeType>(null);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
