'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeSwitch: React.FC = () => {
  const { theme, actualTheme, toggleTheme, mounted } = useTheme();

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <div className="w-[18px] h-[18px]" /> {/* Placeholder to maintain layout */}
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} theme`}
    >
      <div className="relative">
        {actualTheme === 'light' ? (
          <Moon 
            size={18} 
            className="text-gray-700 dark:text-gray-300 transition-all duration-300" 
          />
        ) : (
          <Sun 
            size={18} 
            className="text-yellow-500 transition-all duration-300" 
          />
        )}
      </div>
    </button>
  );
};