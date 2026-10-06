'use client';

import React from 'react';
import {
  Search,
  Moon,
  Sun,
  Shield,
  UserCheck,
  ChevronRight,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { UserRole } from '@/types';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  title?: string;
  breadcrumbs?: string[];
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  title,
  breadcrumbs = ['FactureFlow', 'Dashboard'],
}) => {
  const { currentUser, setUserRole } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    manager: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    cashier: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? 'font-semibold text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search or jump to...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Role Switcher Pill (Quick RBAC demonstration) */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {(['admin', 'manager', 'cashier'] as UserRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setUserRole(role)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition ${
                currentUser.role === role
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/20">
            {currentUser.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
              {currentUser.fullName}
            </p>
            <span
              className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-bold border ${
                roleColors[currentUser.role]
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
