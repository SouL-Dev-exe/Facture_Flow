'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  FileText, Plus, Search, Loader2, X, Save, AlertTriangle, Trash2,
  PackageCheck, PackageOpen, ChevronDown, ChevronUp, Building2,
  Tag, Hash, CalendarDays, ArrowRight, Boxes, RefreshCw, CheckCircle2,
  DollarSign, ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PurchaseOrder, Supplier, Product } from '@/types';

const fmt = (n: number) => n.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DA';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' });

interface NewItemRow { productId: string; quantity: number; unitCost: number }

function PurchaseOrdersContent() {
  const { currentUser } = useAuthStore();
  const searchParams = useSearchParams();
  const filterSupplierId = searchParams.get('supplier');

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'received'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [receiving, setReceiving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  // Form state
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formInvoiceRef, setFormInvoiceRef] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<NewItemRow[]>([{ productId: '', quantity: 1, unitCost: 0 }]);

  const canEdit = ['admin', 'manager'].includes(currentUser.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/purchase-orders', { headers: { 'x-user-id': currentUser.id, 'x-user-role': currentUser.role } }),
        fetch('/api/suppliers', { headers: { 'x-user-id': currentUser.id, 'x-user-role': currentUser.role } }),
        fetch('/api/products', { headers: { 'x-user-id': currentUser.id, 'x-user-role': currentUser.role } }),
      ]);
      const [o, s, p] = await Promise.all([ordersRes.json(), suppliersRes.json(), productsRes.json()]);
      setOrders(Array.isArray(o) ? o : []);
      setSuppliers(Array.isArray(s) ? s : []);
      setProducts(Array.isArray(p.products) ? p.products : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setFormSupplierId(filterSupplierId || '');
    setFormInvoiceRef('');
    setFormNotes('');
    setFormItems([{ productId: '', quantity: 1, unitCost: 0 }]);
    setError('');
    setShowModal(true);
  };

  const addItemRow = () => setFormItems([...formItems, { productId: '', quantity: 1, unitCost: 0 }]);
  const removeItemRow = (i: number) => setFormItems(formItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof NewItemRow, val: string | number) => {
    const updated = [...formItems];
    updated[i] = { ...updated[i], [field]: val };
    if (field === 'productId') {
      const prod = products.find((p) => p.id === val);
      if (prod) updated[i].unitCost = prod.unitCost;
    }
    setFormItems(updated);
  };

  const formTotal = formItems.reduce((sum, it) => sum + (it.quantity * it.unitCost), 0);

  const handleCreate = async () => {
    if (!formSupplierId) { setError('Please select a supplier'); return; }
    if (formItems.some((it) => !it.productId || it.quantity <= 0 || it.unitCost <= 0)) {
      setError('Each line item must have a product, valid quantity and cost'); return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({
          supplierId: formSupplierId,
          invoiceReference: formInvoiceRef || undefined,
          notes: formNotes || undefined,
          items: formItems.map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity),
            unitCost: Number(it.unitCost),
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create PO');
        return;
      }
      setShowModal(false);
      fetchData();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async () => {
    if (!receiveTarget) return;
    setReceiving(receiveTarget.id);
    try {
      await fetch(`/api/purchase-orders/${receiveTarget.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role,
        },
        body: JSON.stringify({ action: 'receive' }),
      });
      setReceiveTarget(null);
      fetchData();
    } finally {
      setReceiving(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await fetch(`/api/purchase-orders/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': currentUser.id, 'x-user-role': currentUser.role },
      });
      setDeleteTarget(null);
      fetchData();
    } finally {
      setDeleting(null);
    }
  };

  const filtered = orders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      (po.supplier?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (po.invoiceReference || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSupplier = !filterSupplierId || po.supplierId === filterSupplierId;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  const totalDraft = orders.filter((o) => o.status === 'draft').length;
  const totalReceived = orders.filter((o) => o.status === 'received').length;
  const totalValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const draftValue = orders.filter((o) => o.status === 'draft').reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/25">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Purchase Orders</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Factures d&apos;achat — incoming stock from suppliers
              {filterSupplierId && suppliers.find((s) => s.id === filterSupplierId) && (
                <span className="ml-2 px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold">
                  Filtered: {suppliers.find((s) => s.id === filterSupplierId)?.name}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/suppliers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
          >
            <Building2 className="w-4 h-4" />
            Suppliers
          </Link>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canEdit && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total POs', value: orders.length, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { label: 'Draft / Pending', value: totalDraft, sub: fmt(draftValue), icon: PackageOpen, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Received', value: totalReceived, icon: PackageCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Ordered Value', value: fmt(totalValue), icon: DollarSign, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">{stat.value}</p>
              {stat.sub && <p className="text-xs text-zinc-400">{stat.sub}</p>}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO number, supplier, or ref..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'draft', 'received'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all border ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400'
              }`}
            >
              {s === 'all' ? 'All Orders' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 font-semibold">No purchase orders found</p>
            <p className="text-sm text-zinc-400 mt-1">
              {search ? 'Try a different search term' : 'Create your first PO to start ordering stock'}
            </p>
            {canEdit && !search && (
              <button
                onClick={openCreate}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> New Purchase Order
              </button>
            )}
          </div>
        ) : (
          filtered.map((po) => {
            const isExpanded = expandedId === po.id;
            return (
              <div
                key={po.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden transition-all"
              >
                {/* PO Row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : po.id)}
                >
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    po.status === 'received'
                      ? 'bg-emerald-500/10'
                      : 'bg-amber-500/10'
                  }`}>
                    {po.status === 'received'
                      ? <PackageCheck className="w-5 h-5 text-emerald-500" />
                      : <PackageOpen className="w-5 h-5 text-amber-500" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">{po.poNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        po.status === 'received'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {po.status}
                      </span>
                      {po.invoiceReference && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono">
                          REF: {po.invoiceReference}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {po.supplier?.name || po.supplierId}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {fmtDate(po.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Boxes className="w-3 h-3" />
                        {po.items.length} line{po.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{fmt(po.totalAmount)}</p>
                    {po.receivedAt && (
                      <p className="text-xs text-emerald-500 flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3 h-3" />
                        Received {fmtDate(po.receivedAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {canEdit && po.status === 'draft' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setReceiveTarget(po); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow"
                          title="Mark as received"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          Receive
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(po); }}
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-zinc-400" />
                      : <ChevronDown className="w-4 h-4 text-zinc-400" />
                    }
                  </div>
                </div>

                {/* Expanded Items */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                    <div className="px-5 py-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Line Items</h4>
                      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800">
                              <th className="text-left px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Product</th>
                              <th className="text-left px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">SKU</th>
                              <th className="text-right px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Qty</th>
                              <th className="text-right px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Unit Cost</th>
                              <th className="text-right px-4 py-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {po.items.map((item) => (
                              <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                <td className="px-4 py-3">
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {item.product?.name || item.productId}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-mono text-zinc-400">{item.product?.sku || '—'}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-zinc-600 dark:text-zinc-300">{fmt(item.unitCost)}</td>
                                <td className="px-4 py-3 text-right font-bold text-zinc-900 dark:text-zinc-100">{fmt(item.totalCost)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                              <td colSpan={4} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-zinc-400">
                                Order Total
                              </td>
                              <td className="px-4 py-3 text-right text-base font-bold text-indigo-600 dark:text-indigo-400">
                                {fmt(po.totalAmount)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      {po.notes && (
                        <div className="mt-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                          <strong>Note:</strong> {po.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New PO Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">New Purchase Order</h2>
                  <p className="text-xs text-zinc-400">Create a facture d&apos;achat for incoming stock</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Header fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  >
                    <option value="">— Select Supplier —</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Invoice Reference */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Supplier Invoice Reference
                  </label>
                  <input
                    value={formInvoiceRef}
                    onChange={(e) => setFormInvoiceRef(e.target.value)}
                    placeholder="e.g. FA-2024-0891"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    placeholder="Delivery instructions, batch info, etc."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Line Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addItemRow}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, i) => {
                    const selectedProduct = products.find((p) => p.id === item.productId);
                    return (
                      <div key={i} className="grid grid-cols-12 gap-2 items-start bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3">
                        {/* Product select */}
                        <div className="col-span-5">
                          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(i, 'productId', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                          >
                            <option value="">— Select Product —</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                          {selectedProduct && (
                            <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" /> Current stock: {selectedProduct.quantitySellable} units
                            </p>
                          )}
                        </div>
                        {/* Qty */}
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        {/* Unit Cost */}
                        <div className="col-span-3">
                          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">Unit Cost (DA)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitCost}
                            onChange={(e) => updateItem(i, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                          />
                        </div>
                        {/* Line Total */}
                        <div className="col-span-1">
                          <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">Total</label>
                          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 pt-2">
                            {(item.quantity * item.unitCost).toLocaleString('fr-DZ', { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        {/* Remove */}
                        <div className="col-span-1 flex items-end justify-center pb-1">
                          {formItems.length > 1 && (
                            <button
                              onClick={() => removeItemRow(i)}
                              className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mt-4 px-4 py-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-indigo-500" />
                    Order Total
                  </span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{fmt(formTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5" />
                Receiving this order will update inventory and recalculate weighted-average costs
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Create Draft PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Confirm */}
      {receiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <PackageCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Receive Purchase Order</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Receiving <strong className="text-zinc-800 dark:text-zinc-200">{receiveTarget.poNumber}</strong> will add{' '}
                  <strong>{receiveTarget.items.length} product(s)</strong> to inventory and recalculate weighted-average costs.
                  This action cannot be reversed.
                </p>
                <div className="mt-3 space-y-1">
                  {receiveTarget.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-1.5">
                      <span className="text-zinc-700 dark:text-zinc-300">{item.product?.name || item.productId}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReceiveTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReceive}
                disabled={!!receiving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
              >
                {receiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                Confirm & Receive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">Delete Draft PO</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Delete <strong>{deleteTarget.poNumber}</strong>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <PurchaseOrdersContent />
    </Suspense>
  );
}
