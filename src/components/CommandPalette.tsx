'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileSpreadsheet,
  RotateCcw,
  AlertTriangle,
  History,
  TrendingUp,
  X,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const navigationItems = [
    { title: 'Dashboard & Analytics', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'POS Billing Engine', path: '/pos', icon: ShoppingCart, category: 'Navigation' },
    { title: 'Inventory & Catalog', path: '/inventory', icon: Boxes, category: 'Navigation' },
    { title: 'Factures (Invoices)', path: '/factures', icon: FileSpreadsheet, category: 'Navigation' },
    { title: 'Credit Notes (Avoir)', path: '/credit-notes', icon: RotateCcw, category: 'Navigation' },
    { title: 'Damaged Stock Write-Offs', path: '/damaged', icon: AlertTriangle, category: 'Navigation' },
    { title: 'Financial Valuation & YoY', path: '/analytics', icon: TrendingUp, category: 'Navigation' },
    { title: 'System Audit Logs', path: '/audit', icon: History, category: 'Navigation' },
  ];

  const filtered = navigationItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle palette
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page... (e.g. POS, Inventory, Audit)"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-80 overflow-y-auto divide-y divide-zinc-800/40">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Pages & Views
          </div>
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  router.push(item.path);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/80 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {item.title}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition" />
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching pages or commands found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
