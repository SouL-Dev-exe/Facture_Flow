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
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { AnalyticsSummary, Facture, Product, AuditLog } from '@/types';
import { StockBadge } from '@/components/StockBadge';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
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
    { month: 'Oct (Now)', valuation: analytics?.totalRetailValuation || 124350, cost: analytics?.totalInventoryCost || 92840 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-indigo-950/40 via-zinc-900 to-zinc-900/60 p-6 rounded-2xl border border-indigo-500/20 backdrop-blur-md shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Enterprise Dashboard
            </span>
            <span className="text-xs text-zinc-400">Live POS & Inventory Overview</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Welcome back, {currentUser.fullName}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Active as <strong className="text-indigo-400 capitalize">{currentUser.role}</strong>. Real-time valuation, stock health, and POS sales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition group"
          >
            <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Open POS Terminal
          </Link>
          <Link
            href="/inventory"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold transition"
          >
            <Boxes className="w-4 h-4" />
            Manage Stock
          </Link>
        </div>
      </div>

      {/* Financial Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Retail Valuation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total Stock Valuation
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-zinc-900 dark:text-white">
              ${analytics?.totalRetailValuation.toLocaleString() || '124,350.00'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="flex items-center text-emerald-500 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{analytics?.yoyValuationGrowth || 24.5}%
              </span>
              <span className="text-zinc-400 text-[11px]">vs. same day last year (YoY)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Inventory Cost */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total Inventory Cost
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-zinc-900 dark:text-white">
              ${analytics?.totalInventoryCost.toLocaleString() || '92,840.00'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-mono text-zinc-500 dark:text-zinc-400">
                {analytics?.totalStockQuantity || 145} units in sellable stock
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Unrealized Profit Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Unrealized Margin
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-emerald-600 dark:text-emerald-400">
              ${analytics?.unrealizedProfit.toLocaleString() || '31,510.00'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                {analytics?.unrealizedProfitMargin || 25.3}% Net Margin
              </span>
              <span className="text-zinc-400 text-[11px]">projected return</span>
            </div>
          </div>
        </div>

        {/* Card 4: Today's POS Invoices */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Today's POS Sales
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black tracking-tight font-mono text-zinc-900 dark:text-white">
              ${analytics?.todaySalesTotal.toLocaleString() || '2,876.40'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="font-mono text-indigo-500 font-bold">
                {analytics?.todayInvoicesCount || 3} invoices
              </span>
              <span className="text-zinc-400 text-[11px]">settled today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Stock Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Valuation & Cost Historical Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Stock Valuation vs. Cost Trajectory
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Continuous historical growth and unrealized margins
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
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
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
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  Stock Alert Center
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {lowStockProducts.length} Needs Attention
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Items under threshold or out of stock requiring supplier reorders.
            </p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {p.name}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-500">
                      SKU: {p.sku} | Min: {p.minStockThreshold}
                    </span>
                  </div>
                  <StockBadge quantity={p.quantitySellable} minThreshold={p.minStockThreshold} />
                </div>
              ))}

              {lowStockProducts.length === 0 && (
                <div className="text-center py-8 text-xs text-zinc-500">
                  🎉 All products are adequately stocked above threshold!
                </div>
              )}
            </div>
          </div>

          <Link
            href="/inventory"
            className="mt-4 w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-semibold text-center text-zinc-800 dark:text-zinc-200 transition block"
          >
            View Full Inventory Catalog &rarr;
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Recent Factures & Live Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Recent Factures (Invoices)
            </h2>
            <Link
              href="/factures"
              className="text-xs font-semibold text-indigo-500 hover:underline"
            >
              View all
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
                    {f.client?.name || 'Walk-in Client'}
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(f.createdAt).toLocaleDateString()} • {f.items.length} items
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-black text-zinc-900 dark:text-white">
                    ${f.totalAmount.toFixed(2)}
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
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Immutable Audit Logs */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Live Audit Activity
              </h2>
            </div>
            <Link
              href="/audit"
              className="text-xs font-semibold text-indigo-500 hover:underline"
            >
              Full Trail
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
                      Target: {a.entityId || a.entityType}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    By: <strong className="text-zinc-300">{a.user?.fullName || 'System'}</strong> ({a.user?.role || 'Daemon'}) • IP: {a.ipAddress}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
