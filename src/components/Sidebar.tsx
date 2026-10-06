'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  FileSpreadsheet,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  History,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentUser } = useAuthStore();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, badge: null },
    { label: 'POS Terminal', href: '/pos', icon: ShoppingCart, badge: 'Live', isHot: true },
    { label: 'Inventory & Stock', href: '/inventory', icon: Boxes, badge: null },
    { label: 'Factures (Invoices)', href: '/factures', icon: FileSpreadsheet, badge: null },
    { label: 'Credit Notes (Avoir)', href: '/credit-notes', icon: RotateCcw, badge: null },
    { label: 'Damaged Stock', href: '/damaged', icon: AlertTriangle, badge: null },
    { label: 'Valuation & YoY', href: '/analytics', icon: TrendingUp, badge: 'YoY' },
    { label: 'Audit Trail', href: '/audit', icon: History, badge: 'Logs' },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/60 backdrop-blur-xl flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors">
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-600/30">
            F
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              Facture<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono block -mt-0.5">
              Enterprise v1.0.0
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-4 space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.isHot
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Role / System Info */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/80">
        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              RBAC Guard
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 capitalize">
              {currentUser.role}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {currentUser.role === 'admin'
              ? 'Full overrides & system write access.'
              : currentUser.role === 'manager'
              ? 'Stock adjust, returns & price overrides.'
              : 'POS & barcode billing checkout only.'}
          </p>
        </div>
      </div>
    </aside>
  );
};
