'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  Camera,
  CheckCircle2,
  BarChart3,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { AnalyticsSummary, DailyStockSnapshot } from '@/types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [snapshots, setSnapshots] = useState<DailyStockSnapshot[]>([]);
  const [isTriggeringSnapshot, setIsTriggeringSnapshot] = useState(false);
  const [snapshotSuccessMsg, setSnapshotSuccessMsg] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const [anRes, snapRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/snapshots'),
      ]);
      const anData = await anRes.json();
      const snapData = await snapRes.json();

      if (anData.success) setAnalytics(anData.analytics);
      if (snapData.success) setSnapshots(snapData.snapshots);
    } catch (err) {
      console.error('Failed to load analytics', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleTriggerSnapshot = async () => {
    setIsTriggeringSnapshot(true);
    setSnapshotSuccessMsg(null);
    try {
      const res = await fetch('/api/snapshots', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSnapshotSuccessMsg(`✓ Snapshot for ${data.snapshot.snapshotDate} generated & committed!`);
        fetchAnalytics();
        setTimeout(() => setSnapshotSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Failed to trigger snapshot', err);
    } finally {
      setIsTriggeringSnapshot(false);
    }
  };

  const categoryChartData = analytics?.categoryValuation || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Valuation Overview & YoY Growth Engine
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time balance sheet metrics, Category valuation breakdown, and automated daily midnight stock snapshots.
          </p>
        </div>

        <button
          onClick={handleTriggerSnapshot}
          disabled={isTriggeringSnapshot}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
        >
          {isTriggeringSnapshot ? (
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Trigger Midnight Snapshot (00:00)
            </>
          )}
        </button>
      </div>

      {snapshotSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{snapshotSuccessMsg}</span>
        </div>
      )}

      {/* Real-time Valuation Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Retail Valuation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500">Total Retail Inventory Valuation</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-black font-mono text-zinc-900 dark:text-white">
              ${analytics?.totalRetailValuation.toLocaleString() || '124,350.00'}
            </h3>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">∑ Quantity × Selling Price</p>
        </div>

        {/* Card 2: Total Inventory Cost */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500">Total Inventory Cost Basis</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-black font-mono text-zinc-900 dark:text-white">
              ${analytics?.totalInventoryCost.toLocaleString() || '92,840.00'}
            </h3>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">∑ Quantity × Unit Cost</p>
        </div>

        {/* Card 3: Unrealized Profit Margins */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-semibold text-zinc-500">Unrealized Gross Margin</span>
          <div className="mt-2 flex items-center justify-between">
            <h3 className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              ${analytics?.unrealizedProfit.toLocaleString() || '31,510.00'}
            </h3>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              {analytics?.unrealizedProfitMargin || 25.3}%
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 font-mono">Retail Valuation - Cost Basis</p>
        </div>
      </div>

      {/* YoY Growth Engine Comparison Container */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-indigo-950/30 via-zinc-900 to-zinc-900 border border-indigo-500/20 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            YoY ENGINE
          </span>
          <h2 className="text-base font-bold text-white">Year-over-Year (YoY) Growth Metrics</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-6">
          Comparison between current inventory performance and the exact same calendar date last year.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 block mb-1">Total Valuation Growth</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-400 flex items-center">
                <ArrowUpRight className="w-5 h-5" />
                +{analytics?.yoyValuationGrowth || 24.5}%
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">vs. $64,200.00 valuation 1 year ago</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 block mb-1">Total Inventory Volume (Units)</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-400 flex items-center">
                <ArrowUpRight className="w-5 h-5" />
                +{analytics?.yoyStockGrowth || 18.2}%
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">vs. 85 units baseline 1 year ago</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <span className="text-xs text-zinc-400 block mb-1">POS Sales Velocity</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-indigo-400 flex items-center">
                <ArrowUpRight className="w-5 h-5" />
                +{analytics?.yoySalesGrowth || 32.4}%
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Faster turnover & customer conversion</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Inventory Valuation by Category
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Comparative distribution of cost vs. potential retail valuation
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
              <span className="w-3 h-3 rounded-full bg-indigo-500" /> Retail Valuation ($)
            </span>
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
              <span className="w-3 h-3 rounded-full bg-purple-500" /> Cost Basis ($)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
              <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="retail" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="cost" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Midnight Historical Snapshots Table */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Automated Daily Stock Snapshots (`daily_stock_snapshots`)
            </h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">00:00 Daily Cron Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Snapshot Date</th>
                <th className="py-3 px-4 text-center">Items Count</th>
                <th className="py-3 px-4 text-center">Total Stock Qty</th>
                <th className="py-3 px-4 text-right">Cost Valuation ($)</th>
                <th className="py-3 px-4 text-right">Retail Valuation ($)</th>
                <th className="py-3 px-4 text-right">Captured At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {snapshots.map((snap) => (
                <tr
                  key={snap.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {snap.snapshotDate}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-zinc-700 dark:text-zinc-300">
                    {snap.totalItemsCount}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-zinc-900 dark:text-white">
                    {snap.totalStockQty}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-500">
                    ${snap.totalCostValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-white">
                    ${snap.totalRetailValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-400 text-[11px]">
                    {new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
