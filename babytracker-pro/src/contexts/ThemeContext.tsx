'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useBabyTrackerStore } from '@/lib/store';

type Theme = 'light' | 'dark' | 'auto';
type ActualTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  actualTheme: ActualTheme;
  colorScheme: string;
  fontSize: string;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: string) => void;
  setFontSize: (size: string) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [actualTheme, setActualTheme] = useState<ActualTheme>('light');
  const [colorScheme, setColorSchemeState] = useState('pistacchio');
  const [fontSize, setFontSizeState] = useState('small');
  const [mounted, setMounted] = useState(false);
  
  const { appSettings, updateSettings } = useBabyTrackerStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Separate effect for settings synchronization
  useEffect(() => {
    if (!mounted) return;

    // Initialize from store settings if available
    if (appSettings) {
      setThemeState(appSettings.theme);
      setColorSchemeState(appSettings.colorScheme);
      setFontSizeState(appSettings.fontSize);
      applyTheme(appSettings.theme);
      applyColorScheme(appSettings.colorScheme);
      applyFontSize(appSettings.fontSize);
    } else {
      // Fallback to localStorage and system preference
      const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') as Theme | null : null;
      const savedColorScheme = typeof window !== 'undefined' ? localStorage.getItem('colorScheme') || 'pistacchio' : 'pistacchio';
      const savedFontSize = typeof window !== 'undefined' ? localStorage.getItem('fontSize') || 'small' : 'small';
      const initialTheme = savedTheme || 'auto';
      
      setThemeState(initialTheme);
      setColorSchemeState(savedColorScheme);
      setFontSizeState(savedFontSize);
      applyTheme(initialTheme);
      applyColorScheme(savedColorScheme);
      applyFontSize(savedFontSize);
    }
  }, [appSettings, mounted]);

  // System theme change listener
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme, mounted]);

  const getActualTheme = (themeMode: Theme): ActualTheme => {
    if (themeMode === 'auto') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light'; // fallback for SSR
    }
    return themeMode as ActualTheme;
  };

  const applyTheme = (newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      const actual = getActualTheme(newTheme);
      setActualTheme(actual);
      
      if (actual === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const applyColorScheme = (scheme: string) => {
    if (typeof window !== 'undefined') {
      // Handle the new pistacchio forest theme with data-theme attribute
      if (scheme === 'pistacchio') {
        // Remove existing color scheme classes
        document.documentElement.classList.remove('theme-green', 'theme-blue', 'theme-amber', 'theme-pink', 'theme-orange', 'theme-pistacchio');
        // Set data-theme attribute for forest theme
        document.documentElement.setAttribute('data-theme', 'forest');
        // Also add class for legacy support
        document.documentElement.classList.add('theme-forest');
      } else {
        // Remove forest theme
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('theme-forest');
        // Remove existing color scheme classes  
        document.documentElement.classList.remove('theme-green', 'theme-blue', 'theme-amber', 'theme-pink', 'theme-orange', 'theme-pistacchio');
        // Add new color scheme class
        document.documentElement.classList.add(`theme-${scheme}`);
      }
    }
  };

  const applyFontSize = (size: string) => {
    if (typeof window !== 'undefined') {
      // Remove existing font size classes
      document.documentElement.classList.remove('text-small', 'text-medium', 'text-large');
      // Add new font size class
      document.documentElement.classList.add(`text-${size}`);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    // Update in store and database
    if (updateSettings) {
      await updateSettings({ theme: newTheme } as any);
    }
  };

  const setColorScheme = async (scheme: string) => {
    setColorSchemeState(scheme);
    applyColorScheme(scheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('colorScheme', scheme);
    }
    
    // Update in store and database
    if (updateSettings) {
      await updateSettings({ colorScheme: scheme } as any);
    }
  };

  const setFontSize = async (size: string) => {
    setFontSizeState(size);
    applyFontSize(size);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fontSize', size);
    }
    
    // Update in store and database
    if (updateSettings) {
      await updateSettings({ fontSize: size } as any);
    }
  };

  const toggleTheme = () => {
    let newTheme: Theme;
    
    if (theme === 'auto') {
      // If currently auto, switch to the opposite of what's currently displayed
      newTheme = actualTheme === 'light' ? 'dark' : 'light';
    } else {
      // Normal toggle between light and dark
      newTheme = theme === 'light' ? 'dark' : 'light';
    }
    
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      actualTheme,
      colorScheme, 
      fontSize,
      toggleTheme, 
      setTheme, 
      setColorScheme,
      setFontSize,
      mounted 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};