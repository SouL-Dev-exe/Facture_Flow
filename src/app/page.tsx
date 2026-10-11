'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Boxes,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Calendar,
  CreditCard,
  Banknote,
  Building,
  FileCheck2,
  Users,
  Trophy,
  Package,
  Layers,
  Clock,
  Sparkles,
  Percent,
  Receipt,
  Scale,
  RefreshCw,
  Flame,
  UserCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import {
  AnalyticsSummary,
  AnalyticsTimeframe,
  Facture,
  Product,
  AuditLog,
} from '@/types';
import { StockBadge } from '@/components/StockBadge';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';

export default function DashboardPage() {
  const { currentUser } = useAuthStore();
  const { t, formatCurrency } = useI18nStore();

  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('daily');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentFactures, setRecentFactures] = useState<Facture[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (selectedTimeframe = timeframe) => {
    try {
      setIsRefreshing(true);
      const headers = { 'x-user-id': currentUser.id };
      const [analyticsRes, facturesRes, productsRes, auditsRes] = await Promise.all([
        fetch(`/api/analytics?timeframe=${selectedTimeframe}&userId=${currentUser.id}`, { headers }),
        fetch('/api/factures'),
        fetch('/api/products'),
        fetch(`/api/audit-logs?userId=${currentUser.id}`, { headers }),
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
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      fetchDashboardData(timeframe);
    } else {
      setIsLoading(false);
    }
  }, [currentUser, timeframe]);

  // View guard for Cashier and Stocker
  if (currentUser.role === 'cashier' || currentUser.role === 'stocker') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {currentUser.role === 'cashier' ? 'Cashier Restricted View' : 'Warehouse Stocker View'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
          Access to Financial Analytics and System Overrides is restricted to Store Managers and Administrators.
        </p>
        <div className="flex items-center gap-3">
          {currentUser.role === 'cashier' && (
            <Link
              href="/pos"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Go to POS Register
            </Link>
          )}
          {currentUser.role === 'stocker' && (
            <Link
              href="/inventory"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
            >
              <Boxes className="w-4 h-4" />
              Go to Inventory Management
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isPositiveGrowth = (analytics?.momGrowthPercentage || 0) >= 0;

  return (
    <div className="space-y-6 pb-16">
      {/* ================= TOP HERO & TIMEFRAME SELECTOR ================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-indigo-950/40 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 end-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {t.dashboard.enterpriseBadge}
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              {t.dashboard.subtitle}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            {t.dashboard.welcome},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-indigo-300">
              {currentUser.fullName}
            </span>
          </h1>

          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            {t.header.currentlyActive}{' '}
            <strong className="text-indigo-400 capitalize">
              {t.roles[currentUser.role as keyof typeof t.roles] || currentUser.role}
            </strong>
            . {t.dashboard.overviewDesc}
          </p>
        </div>

        {/* Timeframe View Toggle & Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Framer-Motion Timeframe Tabs */}
          <div className="flex items-center bg-zinc-950/80 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
            {(
              [
                { key: 'daily', label: t.dashboard.timeframeDaily, icon: Clock },
                { key: 'monthly', label: t.dashboard.timeframeMonthly, icon: Calendar },
                { key: 'yearly', label: t.dashboard.timeframeYearly, icon: TrendingUp },
              ] as const
            ).map((tab) => {
              const active = timeframe === tab.key;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setTimeframe(tab.key)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    active
                      ? 'text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTimeframeTab"
                      className="absolute inset-0 bg-indigo-600 rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <TabIcon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(timeframe)}
            title="Refresh Metrics"
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl border border-zinc-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: TIMEFRAME-SPECIFIC KPI METRICS ================= */}
      <AnimatePresence mode="wait">
        <motion.div
          key={timeframe}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: Gross Revenue */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                {timeframe === 'daily'
                  ? t.dashboard.todaySales
                  : timeframe === 'monthly'
                  ? t.dashboard.totalRevenue + ' (Mois)'
                  : t.dashboard.totalRevenue + ' (Année)'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight font-mono text-white">
                {formatCurrency(analytics?.revenue || 0)}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs">
                {timeframe === 'monthly' ? (
                  <span
                    className={`flex items-center gap-0.5 font-bold ${
                      isPositiveGrowth ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositiveGrowth ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {analytics?.momGrowthPercentage}% MoM
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{analytics?.yoySalesGrowth || 32.4}% YoY
                  </span>
                )}
                <span className="text-zinc-500 text-[11px]">
                  {analytics?.transactionsCount || 0} {t.dashboard.transactions}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Timeframe Context (Basket / TVA / Turnover) */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                {timeframe === 'daily'
                  ? t.dashboard.avgBasket
                  : timeframe === 'monthly'
                  ? t.dashboard.tvaCollected
                  : 'Chiffre d’Affaires Annuel'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                {timeframe === 'daily' ? (
                  <Receipt className="w-4 h-4" />
                ) : timeframe === 'monthly' ? (
                  <FileCheck2 className="w-4 h-4" />
                ) : (
                  <Scale className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight font-mono text-white">
                {timeframe === 'daily'
                  ? formatCurrency(analytics?.averageBasketSize || 0)
                  : timeframe === 'monthly'
                  ? formatCurrency(analytics?.tvaCollected || 0)
                  : formatCurrency(analytics?.revenue || 0)}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-2">
                {timeframe === 'daily'
                  ? `${analytics?.transactionsCount || 0} paniers encaissés`
                  : timeframe === 'monthly'
                  ? `Taux légal 19% applicable aux factures`
                  : `Clôture d’exercice en cours`}
              </p>
            </div>
          </div>

          {/* Card 3: Net Profit / Margin */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                {timeframe === 'monthly' ? 'Marge Nette & Bénéfice' : t.dashboard.grossProfit}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight font-mono text-emerald-400">
                {formatCurrency(analytics?.netProfit || 0)}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="font-bold text-emerald-400 font-mono">
                  {analytics?.netProfitMargin || 0}%
                </span>
                <span className="text-zinc-500 text-[11px]">
                  {t.dashboard.netMargin}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Discounts or Transactions */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-zinc-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                {timeframe === 'monthly'
                  ? t.dashboard.discountsApplied
                  : timeframe === 'daily'
                  ? 'Transactions Validées'
                  : 'Valorisation du Stock'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black tracking-tight font-mono text-white">
                {timeframe === 'monthly'
                  ? formatCurrency(analytics?.discountsApplied || 0)
                  : timeframe === 'daily'
                  ? analytics?.transactionsCount || 0
                  : formatCurrency(analytics?.totalRetailValuation || 0)}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-2">
                {timeframe === 'monthly'
                  ? `Remises commerciales appliquées au POS`
                  : timeframe === 'daily'
                  ? `Commandes complétées aujourd'hui`
                  : `${analytics?.totalStockQuantity || 0} unités en entrepôt`}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ================= SECTION 2: CHARTS & FINANCIAL VELOCITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Dynamic Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {timeframe === 'daily' && <Clock className="w-4 h-4 text-indigo-400" />}
                  {timeframe === 'monthly' && <Calendar className="w-4 h-4 text-indigo-400" />}
                  {timeframe === 'yearly' && <TrendingUp className="w-4 h-4 text-indigo-400" />}
                  {timeframe === 'daily'
                    ? t.dashboard.hourlyVelocity
                    : timeframe === 'monthly'
                    ? t.dashboard.monthlyPerformance
                    : t.dashboard.yoyComparison}
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {timeframe === 'daily'
                  ? t.dashboard.hourlySubtitle
                  : timeframe === 'monthly'
                  ? 'Historique financier sur les 6 derniers mois avec TVA déduite'
                  : 'Comparaison pluriannuelle du chiffre d’affaires et de la valorisation des stocks'}
              </p>
            </div>

            {/* Quick Status Tag */}
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {timeframe.toUpperCase()} MODE
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {timeframe === 'daily' ? (
                /* Daily Hourly Sales Velocity Bar Chart */
                <BarChart data={analytics?.hourlySalesVelocity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} DZD`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '1rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Ventes']}
                    labelFormatter={(label) => `Créneau : ${label}`}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {(analytics?.hourlySalesVelocity || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.revenue > 1500 ? '#6366f1' : entry.revenue > 0 ? '#818cf8' : '#27272a'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : timeframe === 'monthly' ? (
                /* Monthly Revenue vs Cost Area Chart */
                <AreaChart data={analytics?.monthlyTrends || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '1rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    name="Chiffre d’Affaires"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="urlColorRev"
                  />
                  <Area
                    type="monotone"
                    name="Bénéfice Net"
                    dataKey="netProfit"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="urlColorNet"
                  />
                </AreaChart>
              ) : (
                /* Yearly Comparison Bar Chart */
                <BarChart data={analytics?.yearlyComparison || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="year" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '1rem',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val) || 0)]}
                  />
                  <Legend />
                  <Bar name="Chiffre d’Affaires" dataKey="turnover" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  <Bar name="Valorisation Stock" dataKey="retailValuation" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown Widget (1 col) */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                {t.dashboard.paymentBreakdown}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {timeframe.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-5">
              Répartition des encaissements par méthode de paiement enregistrée au terminal.
            </p>

            <div className="space-y-3">
              {[
                {
                  label: t.dashboard.cash,
                  amount: analytics?.paymentBreakdown.cash || 0,
                  icon: Banknote,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                  bar: 'bg-emerald-500',
                },
                {
                  label: t.dashboard.card,
                  amount: analytics?.paymentBreakdown.card || 0,
                  icon: CreditCard,
                  color: 'text-indigo-400',
                  bg: 'bg-indigo-500/10',
                  bar: 'bg-indigo-500',
                },
                {
                  label: t.dashboard.transfer,
                  amount: analytics?.paymentBreakdown.bankTransfer || 0,
                  icon: Building,
                  color: 'text-purple-400',
                  bg: 'bg-purple-500/10',
                  bar: 'bg-purple-500',
                },
                {
                  label: t.dashboard.cheque,
                  amount: analytics?.paymentBreakdown.cheque || 0,
                  icon: FileCheck2,
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/10',
                  bar: 'bg-amber-500',
                },
              ].map((m) => {
                const total = analytics?.revenue || 1;
                const pct = total > 0 ? Math.round((m.amount / total) * 100) : 0;
                const Icon = m.icon;
                return (
                  <div key={m.label} className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${m.bg} ${m.color} flex items-center justify-center`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-zinc-200">{m.label}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-mono text-xs font-bold text-white">
                          {formatCurrency(m.amount)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono ms-2">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${m.bar} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800/80 mt-4 flex items-center justify-between text-xs text-zinc-400">
            <span>Total Encaissé :</span>
            <strong className="text-white font-mono text-sm">
              {formatCurrency(analytics?.revenue || 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* ================= SECTION 3: INVENTORY CAPITAL & UNREALIZED PROFIT WIDGET ================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950/30 border border-zinc-800/80 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                {t.dashboard.inventoryValuation}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Suivi du capital immobilisé en stock vs valorisation potentielle au prix de vente catalogue
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              +{analytics?.unrealizedProfitMargin || 0}% Marge Globale
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 block mb-1">
              {t.dashboard.capitalTiedUp}
            </span>
            <h3 className="text-xl font-black font-mono text-purple-400">
              {formatCurrency(analytics?.totalInventoryCost || 0)}
            </h3>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Coût total d&apos;achat fournisseur (Σ Quantité × Coût)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 block mb-1">
              {t.dashboard.potentialValuation}
            </span>
            <h3 className="text-xl font-black font-mono text-indigo-400">
              {formatCurrency(analytics?.totalRetailValuation || 0)}
            </h3>
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Recettes théoriques au prix public (Σ Quantité × Prix)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-400 block mb-1">
              {t.dashboard.unrealizedProfit}
            </span>
            <h3 className="text-xl font-black font-mono text-emerald-300">
              {formatCurrency(analytics?.unrealizedProfit || 0)}
            </h3>
            <span className="text-[11px] text-emerald-500/80 mt-1 block">
              Plus-value brute latente en attente d&apos;écoulement
            </span>
          </div>
        </div>
      </div>

      {/* ================= SECTION 4: LEADERBOARDS & EMPLOYEE PERFORMANCE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard 1: Top-Selling Products */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              {t.dashboard.topProducts}
            </h2>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-2.5">
            {(analytics?.topProducts || []).slice(0, 5).map((prod, idx) => (
              <div
                key={prod.id}
                className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                      idx === 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : idx === 1
                        ? 'bg-zinc-300/20 text-zinc-300 border border-zinc-300/30'
                        : idx === 2
                        ? 'bg-amber-800/20 text-amber-600 border border-amber-800/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-white line-clamp-1">
                      {prod.name}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {prod.unitsSold} vendus • {prod.categoryName}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="font-mono text-xs font-bold text-indigo-400 block">
                    {formatCurrency(prod.totalRevenue)}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    +{formatCurrency(prod.profit)}
                  </span>
                </div>
              </div>
            ))}

            {(analytics?.topProducts || []).length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">Aucune vente enregistrée pour ce filtre.</p>
            )}
          </div>
        </div>

        {/* Leaderboard 2: Top Categories */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              {t.dashboard.topCategories}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              VOLUME
            </span>
          </div>

          <div className="space-y-2.5">
            {(analytics?.topCategories || []).slice(0, 5).map((cat, idx) => (
              <div
                key={cat.id || idx}
                className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {cat.name}
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {cat.unitsSold} articles vendus
                  </span>
                </div>

                <div className="text-end">
                  <span className="font-mono text-xs font-bold text-white block">
                    {formatCurrency(cat.totalRevenue)}
                  </span>
                </div>
              </div>
            ))}

            {(analytics?.topCategories || []).length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">Aucune catégorie active sur cette période.</p>
            )}
          </div>
        </div>

        {/* Leaderboard 3: Employee / Cashier Performance (Strictly Admin & Manager) */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              {t.dashboard.employeePerformance}
            </h2>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              AUDIT RH
            </span>
          </div>

          <p className="text-xs text-zinc-400 mb-4">
            Suivi des ventes et montants totaux traités par vendeur pour contrôler la productivité.
          </p>

          <div className="space-y-2.5">
            {(analytics?.employeePerformance || []).map((emp) => (
              <div
                key={emp.userId}
                className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {emp.fullName}
                    </h4>
                    <span className="text-[10px] text-zinc-400 capitalize">
                      {emp.role} • {emp.facturesCount} factures
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="font-mono text-xs font-bold text-emerald-400 block">
                    {formatCurrency(emp.totalRevenue)}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Moy. {formatCurrency(emp.averageBasket)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= SECTION 5: ALERTS & FINANCIAL WRITE-OFFS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Reorder Alerts */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-white">
                {t.dashboard.lowStockAlerts}
              </h2>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              {t.dashboard.viewAll}
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">{p.name}</h4>
                  <span className="text-[10px] font-mono text-zinc-500">
                    SKU: {p.sku} • Seuil min: {p.minStockThreshold}
                  </span>
                </div>
                <StockBadge
                  quantity={p.quantitySellable}
                  minThreshold={p.minStockThreshold}
                />
              </div>
            ))}

            {lowStockProducts.length === 0 && (
              <div className="text-center py-6 text-zinc-500 text-xs">
                {t.dashboard.allStocked}
              </div>
            )}
          </div>
        </div>

        {/* Damaged Goods & Financial Write-Off Alert */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-white">
                  {t.dashboard.damagedGoodsAlert}
                </h2>
              </div>
              <Link
                href="/damaged"
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
              >
                {t.dashboard.viewAll}
              </Link>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Pertes directes subies suite aux articles défectueux, cassés ou dépréciés déclarés au magasin.
            </p>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-300 font-semibold block">
                  Perte Financière Totale
                </span>
                <span className="text-2xl font-black font-mono text-rose-400">
                  {formatCurrency(analytics?.damagedGoodsCostLoss || 0)}
                </span>
              </div>
              <div className="text-end">
                <span className="text-xs text-rose-300 block">Unités Avariées</span>
                <span className="text-xl font-bold font-mono text-rose-400">
                  {analytics?.totalDamagedQuantity || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Rapprochement des pertes :</span>
            <Link
              href="/damaged"
              className="text-indigo-400 hover:underline font-semibold"
            >
              Déclarer une casse &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ================= SECTION 6: RECENT FACTURES & AUDIT LOGS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">
              {t.dashboard.recentInvoices}
            </h2>
            <Link
              href="/factures"
              className="text-xs font-semibold text-indigo-400 hover:underline"
            >
              {t.dashboard.viewAll}
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentFactures.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {f.invoiceNumber}
                  </span>
                  <p className="text-xs text-zinc-300 font-medium">
                    {f.client?.name || t.pos.walkInCustomer}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(f.createdAt).toLocaleDateString()} • {f.items.length} {t.common.items}
                  </span>
                </div>
                <div className="text-end">
                  <p className="font-mono text-sm font-black text-white">
                    {formatCurrency(f.totalAmount)}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      f.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : f.status === 'returned'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                {t.dashboard.recentActivity}
              </h2>
            </div>
            <Link
              href="/audit"
              className="text-xs font-semibold text-indigo-400 hover:underline"
            >
              {t.dashboard.viewAll}
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAudits.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md text-[10px] border border-purple-500/20">
                      {a.action}
                    </span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {a.entityId || a.entityType}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {t.audit.user}: <strong className="text-zinc-200">{a.user?.fullName || 'System'}</strong>
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
