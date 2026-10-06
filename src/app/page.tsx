'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AnalyticsSummary, Facture, Product, AuditLog } from '@/types';
import { StockBadge } from '@/components/StockBadge';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { t, formatCurrency } = useI18nStore();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentFactures, setRecentFactures] = useState<Facture[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, facturesRes, productsRes, auditsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/factures'),
        fetch('/api/products'),
        fetch('/api/audit-logs'),
      ]);

      const analyticsData = await analyticsRes.json();
      const facturesData = await facturesRes.json();
      const productsData = await productsRes.json();
      const auditsData = await auditsRes.json();

      if (analyticsData.success) setAnalytics(analyticsData.analytics);
      if (facturesData.success) setRecentFactures(facturesData.factures.slice(0, 5));
      if (productsData.success) {
        const low = productsData.products.filter(
          (p: Product) => p.quantitySellable <= p.minStockThreshold
        );
        setLowStockProducts(low);
      }
      if (auditsData.success) setRecentAudits(auditsData.logs.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const chartData = [
    { month: 'Apr', valuation: 74000, cost: 55000 },
    { month: 'May', valuation: 82000, cost: 61000 },
    { month: 'Jun', valuation: 89000, cost: 67000 },
    { month: 'Jul', valuation: 98000, cost: 73000 },
    { month: 'Aug', valuation: 106000, cost: 79000 },
    { month: 'Sep', valuation: 118000, cost: 87000 },
    { month: 'Oct', valuation: analytics?.totalRetailValuation || 124350, cost: analytics?.totalInventoryCost || 92840 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-indigo-950/40 via-zinc-900 to-zinc-900/60 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {t.dashboard.enterpriseBadge}
            </span>
            <span className="text-xs text-zinc-400">{t.dashboard.subtitle}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            {t.dashboard.welcome}, {currentUser.fullName}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t.header.currentlyActive}{' '}
            <strong className="text-indigo-400">
              {t.roles[currentUser.role as keyof typeof t.roles] || currentUser.role}
            </strong>
            . {t.dashboard.overviewDesc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition group"
          >
            <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {t.dashboard.quickPos}
          </Link>
          <Link
            href="/inventory"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold transition"
          >
            <Boxes className="w-4 h-4" />
            {t.dashboard.addStock}
          </Link>
        </div>
      </div>

      {/* Financial Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Retail Valuation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t.dashboard.stockValuation}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-zinc-900 dark:text-white">
              {formatCurrency(analytics?.totalRetailValuation || 124350)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center text-emerald-500 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{analytics?.yoyValuationGrowth || 24.5}%
              </span>
              <span className="text-zinc-400 text-[11px]">YoY</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Inventory Cost */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t.dashboard.totalCost}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-zinc-900 dark:text-white">
              {formatCurrency(analytics?.totalInventoryCost || 92840)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                {analytics?.totalStockQuantity || 145} {t.common.items}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Unrealized Profit Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t.dashboard.unrealizedMargin}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(analytics?.unrealizedProfit || 31510)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                {analytics?.unrealizedProfitMargin || 25.3}%
              </span>
              <span className="text-zinc-400 text-[11px]">{t.dashboard.grossProfit}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Today's POS Invoices */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t.dashboard.todaySales}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-zinc-900 dark:text-white">
              {formatCurrency(analytics?.todaySalesTotal || 2876.40)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-mono text-indigo-500 font-bold">
                {analytics?.todayInvoicesCount || 3} {t.dashboard.todayOrders}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Stock Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Valuation & Cost Historical Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {t.dashboard.monthlyPerformance}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t.dashboard.revenueVsCost}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="w-3 h-3 rounded-full bg-indigo-500" /> {t.dashboard.valuationTrend}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="w-3 h-3 rounded-full bg-purple-500" /> {t.dashboard.costTrend}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#3f3f46',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valuation"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#valGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#costGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Low Stock Alert Center */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  {t.dashboard.lowStockAlerts}
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {lowStockProducts.length}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              {t.inventory.subtitle}
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pe-1">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between"
                >
                  <div className="min-w-0 pe-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {p.name}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {t.inventory.sku}: {p.sku} | {t.inventory.minThreshold}: {p.minStockThreshold}
                    </span>
                  </div>
                  <StockBadge quantity={p.quantitySellable} minThreshold={p.minStockThreshold} />
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <div className="text-center py-8 text-xs text-zinc-500">
                  🎉 {t.dashboard.allStocked}
                </div>
              )}
            </div>
          </div>

          <Link
            href="/inventory"
            className="mt-4 w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-semibold text-center text-zinc-800 dark:text-zinc-200 transition block"
          >
            {t.dashboard.viewAll} &rarr;
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Recent Factures & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              {t.dashboard.recentInvoices}
            </h2>
            <Link
              href="/factures"
              className="text-xs font-semibold text-indigo-500 hover:underline"
            >
              {t.dashboard.viewAll}
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentFactures.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {f.invoiceNumber}
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    {f.client?.name || t.pos.walkInCustomer}
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(f.createdAt).toLocaleDateString()} • {f.items.length} {t.common.items}
                  </span>
                </div>
                <div className="text-end">
                  <p className="font-mono text-sm font-black text-zinc-900 dark:text-white">
                    {formatCurrency(f.totalAmount)}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      f.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : f.status === 'returned'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {t.factures[f.status as keyof typeof t.factures] || f.status}
                  </span>
                </div>
              </div>
            ))}

            {recentFactures.length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">{t.dashboard.noInvoices}</p>
            )}
          </div>
        </div>

        {/* Live Immutable Audit Logs */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                {t.dashboard.recentActivity}
              </h2>
            </div>
            <Link
              href="/audit"
              className="text-xs font-semibold text-indigo-500 hover:underline"
            >
              {t.dashboard.viewAll}
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAudits.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded text-[10px]">
                      {a.action}
                    </span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {a.entityId || a.entityType}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {t.audit.user}: <strong className="text-zinc-300">{a.user?.fullName || 'System'}</strong> • IP: {a.ipAddress}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {recentAudits.length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">{t.dashboard.noActivity}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
