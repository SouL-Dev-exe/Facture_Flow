'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { useThemeStore } from '@/store/themeStore';
import { useI18nStore } from '@/store/i18nStore';

export const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { isDarkMode } = useThemeStore();
  const { isRTL } = useI18nStore();

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sync RTL direction & font for Arabic
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    if (isRTL) {
      document.documentElement.style.fontFamily =
        "'Noto Sans Arabic', 'Cairo', 'Tahoma', 'Arial', sans-serif";
    } else {
      document.documentElement.style.fontFamily = '';
    }
  }, [isRTL]);

  return (
    <div
      className="flex w-full h-screen overflow-hidden bg-slate-50 dark:bg-[#09090b]"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

        <main className="flex-1 overflow-y-auto p-6 transition-colors">
          {children}
        </main>
      </div>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
