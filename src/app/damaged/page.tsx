'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, DollarSign, Search, ShieldCheck } from 'lucide-react';
import { DamagedStockLog } from '@/types';
import { useI18nStore } from '@/store/i18nStore';

export default function DamagedStockPage() {
  const { t, formatCurrency } = useI18nStore();
  const [logs, setLogs] = useState<DamagedStockLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDamagedLogs = async () => {
    try {
      const res = await fetch('/api/damaged-stock');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load damaged stock logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDamagedLogs();
  }, []);

  const totalLoss = logs.reduce((acc, l) => acc + l.costLossValue, 0);
  const totalUnits = logs.reduce((acc, l) => acc + l.quantityWrittenOff, 0);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      searchQuery === '' ||
      l.product?.name.toLowerCase().includes(q) ||
      l.product?.sku.toLowerCase().includes(q) ||
      l.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t.damaged.title}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.damaged.subtitle}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500">{t.damaged.totalLoss}</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(totalLoss)}
            </h3>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">{t.damaged.basisDesc}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500">{t.damaged.totalUnits}</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-black font-mono text-zinc-900 dark:text-white">
              {totalUnits}
            </h3>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">{t.damaged.deductDesc}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500">{t.damaged.totalEvents}</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-black font-mono text-zinc-900 dark:text-white">
              {logs.length}
            </h3>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">{t.damaged.authDesc}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.damaged.searchLogs}
            className="w-full ps-10 pe-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Damaged Stock Log Table */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">{t.damaged.date}</th>
                <th className="py-3 px-4">{t.damaged.product} / {t.inventory.sku}</th>
                <th className="py-3 px-4">{t.damaged.loggedBy}</th>
                <th className="py-3 px-4">{t.damaged.reason}</th>
                <th className="py-3 px-4 text-center">{t.damaged.qtyWrittenOff}</th>
                <th className="py-3 px-4 text-end">{t.damaged.costLoss}</th>
                <th className="py-3 px-4">{t.damaged.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {log.product?.name || t.damaged.product}
                    </p>
                    <span className="font-mono text-[10px] text-zinc-400">
                      {t.inventory.sku}: {log.product?.sku}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      {log.user?.fullName || t.roles.manager}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-rose-500 dark:text-rose-400">
                    {log.reason}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {log.quantityWrittenOff}
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-black text-rose-600 dark:text-rose-400">
                    -{formatCurrency(log.costLossValue)}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-[11px] max-w-xs truncate">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                    {t.damaged.noLogs}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
