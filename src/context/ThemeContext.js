import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

//DEFINICIÓN DE PALETAS DE COLORES FINTECH
export const lightTheme = {
  dark: false,
  background: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  premiumCard: '#1E293B',
  premiumText: '#94A3B8',
  accent: '#6366F1',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#E65100',
};

export const darkTheme = {
  dark: true,
  background: '#0F172A',
  card: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  premiumCard: '#1E293B',
  premiumText: '#94A3B8',
  accent: '#818CF8',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // Captura el tema por defecto del sistema operativo
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');
  const [themeLoading, setThemeLoading] = useState(true);

  // Carga la preferencia guardada al relanzar la app
  useEffect(() => {
    const loadPersistedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@user_theme_preference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          setIsDarkMode(systemScheme === 'dark');
        }
      } catch (error) {
        console.error('Error cargando el tema persistente:', error);
      } finally {
        setThemeLoading(false);
      }
    };
    loadPersistedTheme();
  }, [systemScheme]);

  // Función para alternar el tema y persistirlo localmente
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('@user_theme_preference', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error guardando la preferencia de tema:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme, themeLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};
