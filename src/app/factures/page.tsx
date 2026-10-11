'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Printer,
  RotateCcw,
  X,
  Pencil,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Package,
} from 'lucide-react';
import { Facture, Product, FactureItem } from '@/types';
import { PrintableInvoice } from '@/components/PrintableInvoice';
import { ManagerPinModal } from '@/components/ManagerPinModal';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';

const TVA_RATE = 0.19;

// ─────────────────────────────────────────────────────────────
// TVA Toggle Switch Component
// ─────────────────────────────────────────────────────────────
function TvaToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
        enabled
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
      }`}
    >
      {enabled ? (
        <ToggleRight className="w-5 h-5 text-emerald-400" />
      ) : (
        <ToggleLeft className="w-5 h-5 text-zinc-500" />
      )}
      <span>
        TVA 19%{' '}
        <span className={enabled ? 'text-emerald-300' : 'text-zinc-600'}>
          {enabled ? '— Activée' : '— Désactivée'}
        </span>
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Edit Facture Modal
// ─────────────────────────────────────────────────────────────
interface EditFactureModalProps {
  facture: Facture;
  onClose: () => void;
  onSaved: (updated: Facture) => void;
  formatCurrency: (n: number) => string;
}

function EditFactureModal({ facture, onClose, onSaved, formatCurrency }: EditFactureModalProps) {
  const { currentUser } = useAuthStore();

  // Editable line items (cloned from facture)
  const [editItems, setEditItems] = useState<
    {
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      unitCost: number;
      unitPrice: number;
      discount: number;
      totalPrice: number;
    }[]
  >(() =>
    facture.items.map((it) => ({
      productId: it.productId,
      name: it.product?.name ?? it.productId,
      sku: it.product?.sku ?? '',
      quantity: it.quantity,
      unitCost: it.unitCost,
      unitPrice: it.unitPrice,
      discount: it.discount,
      totalPrice: it.totalPrice,
    }))
  );

  const [hasTva, setHasTva] = useState(facture.hasTva ?? true);
  const [discountAmount, setDiscountAmount] = useState(facture.discountAmount);
  const [notes, setNotes] = useState(facture.notes ?? '');

  // Product search / add
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.products); });
  }, []);

  // Filtered product list for add-item search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      )
      .slice(0, 8);
  }, [products, productSearch]);

  // Real-time totals
  const subtotal = useMemo(
    () => editItems.reduce((acc, it) => acc + it.totalPrice, 0),
    [editItems]
  );
  const taxAmount = hasTva ? Math.round(subtotal * TVA_RATE * 100) / 100 : 0;
  const total = Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

  // ── Item helpers ──
  const updateItem = (idx: number, field: string, value: number) => {
    setEditItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      // Recalculate totalPrice
      const effectivePrice = item.unitPrice * item.quantity - item.discount;
      item.totalPrice = Math.max(0, Math.round(effectivePrice * 100) / 100);
      next[idx] = item;
      return next;
    });
  };

  const removeItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addProduct = (prod: Product) => {
    const existing = editItems.findIndex((it) => it.productId === prod.id);
    if (existing !== -1) {
      updateItem(existing, 'quantity', editItems[existing].quantity + 1);
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          quantity: 1,
          unitCost: prod.unitCost,
          unitPrice: prod.sellingPrice,
          discount: 0,
          totalPrice: prod.sellingPrice,
        },
      ]);
    }
    setProductSearch('');
    setShowProductSearch(false);
  };

  // ── Save ──
  const handleSave = async () => {
    if (editItems.length === 0) {
      setError('Invoice must have at least 1 item.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/factures/${facture.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: editItems,
          hasTva,
          discountAmount,
          notes,
          actorUserId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved(data.facture);
        onClose();
      } else {
        setError(data.message || 'Failed to save.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Edit Invoice</h3>
              <span className="text-xs font-mono text-zinc-400">{facture.invoiceNumber}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* TVA Toggle */}
        <div className="flex items-center justify-between mb-4 p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60">
          <div>
            <p className="text-xs font-semibold text-zinc-200">Taxe sur la Valeur Ajoutée (TVA)</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {hasTva ? 'Client assujetti — TVA 19% appliquée' : 'Non-assujetti — Exonéré de TVA'}
            </p>
          </div>
          <TvaToggle enabled={hasTva} onChange={setHasTva} />
        </div>

        {/* Line Items */}
        <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
          {editItems.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-700 rounded-xl">
              No items. Use the search below to add products.
            </div>
          )}
          {editItems.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className="grid grid-cols-[1fr_80px_90px_80px_auto] gap-2 items-center bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3 py-2"
            >
              {/* Name */}
              <div className="min-w-0">
                <p className="font-semibold text-xs text-white truncate">{item.name}</p>
                <span className="font-mono text-[10px] text-zinc-400">{item.sku}</span>
              </div>

              {/* Qty */}
              <div className="flex flex-col items-center gap-0.5">
                <label className="text-[9px] uppercase text-zinc-500 font-bold">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                  className="w-full text-center px-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Unit Price */}
              <div className="flex flex-col items-center gap-0.5">
                <label className="text-[9px] uppercase text-zinc-500 font-bold">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
                  className="w-full text-center px-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Discount */}
              <div className="flex flex-col items-center gap-0.5">
                <label className="text-[9px] uppercase text-zinc-500 font-bold">Disc.</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.discount}
                  onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                  className="w-full text-center px-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-amber-300 focus:outline-none"
                />
              </div>

              {/* Total + Remove */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white whitespace-nowrap">
                  {formatCurrency(item.totalPrice)}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1 text-zinc-500 hover:text-rose-400 transition rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Product Search */}
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => setShowProductSearch(!showProductSearch)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item from Catalog
          </button>

          {showProductSearch && (
            <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  autoFocus
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search by name, SKU or barcode..."
                  className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <button onClick={() => setShowProductSearch(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {filteredProducts.length === 0 && productSearch.trim() && (
                  <div className="py-6 text-center text-xs text-zinc-500 flex flex-col items-center gap-1">
                    <Package className="w-5 h-5 text-zinc-600" />
                    No products found
                  </div>
                )}
                {filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => addProduct(prod)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-700/60 transition text-start"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{prod.name}</p>
                      <span className="text-[10px] font-mono text-zinc-400">{prod.sku}</span>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-xs font-bold text-indigo-400">{formatCurrency(prod.sellingPrice)}</p>
                      <p className={`text-[10px] font-mono ${prod.quantitySellable > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {prod.quantitySellable} in stock
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totals Summary */}
        <div className="bg-zinc-800/50 border border-zinc-700/60 rounded-xl p-4 mb-4 space-y-2 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Invoice Discount</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500">−</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-24 text-end px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono text-amber-300 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className={`flex justify-between ${hasTva ? 'text-zinc-300' : 'text-zinc-600 line-through'}`}>
            <span>TVA (19%)</span>
            <span className="font-mono">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-white text-sm border-t border-zinc-700 pt-2 mt-1">
            <span>Total TTC</span>
            <span className="font-mono text-indigo-400">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || editItems.length === 0}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status badge helper
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    returned: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    unpaid: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    partially_paid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
        styles[status] ?? 'bg-zinc-700/40 text-zinc-400 border-zinc-700'
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function FacturesPage() {
  const { currentUser } = useAuthStore();
  const { t, formatCurrency } = useI18nStore();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFactureForPrint, setSelectedFactureForPrint] = useState<Facture | null>(null);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);

  if (currentUser.role === 'stocker') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Factures & Billing Restricted
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-6">
          Warehouse stockers do not manage customer invoices or billing. Please access Inventory to update stock quantities and categories.
        </p>
        <a
          href="/inventory"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
        >
          Go to Inventory
        </a>
      </div>
    );
  }

  // Return / Credit Note Modal
  const [returnFacture, setReturnFacture] = useState<Facture | null>(null);
  const [returnItems, setReturnItems] = useState<{
    [productId: string]: {
      quantityReturned: number;
      unitRefundPrice: number;
      restockDestination: 'sellable' | 'damaged';
    };
  }>({});
  const [returnReason, setReturnReason] = useState('Customer return / exchange');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinPurpose, setPinPurpose] = useState<'return' | 'edit'>('return');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const fetchFactures = async () => {
    try {
      const res = await fetch('/api/factures');
      const data = await res.json();
      if (data.success) setFactures(data.factures);
    } catch (err) {
      console.error('Failed to load factures', err);
    }
  };

  useEffect(() => {
    fetchFactures();
  }, []);

  const filteredFactures = factures.filter((f) => {
    const matchesSearch =
      searchQuery === '' ||
      f.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.client?.name && f.client.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Return / Credit Note ──
  const handleOpenReturnModal = (facture: Facture) => {
    if (currentUser.role === 'cashier') {
      setPinPurpose('return');
      setSelectedFactureForPrint(facture);
      setIsPinModalOpen(true);
      return;
    }
    setReturnFacture(facture);
    const initialMap: any = {};
    facture.items.forEach((it) => {
      initialMap[it.productId] = {
        quantityReturned: it.quantity,
        unitRefundPrice: it.unitPrice,
        restockDestination: 'sellable',
      };
    });
    setReturnItems(initialMap);
  };

  const handleOpenEditModal = (facture: Facture) => {
    if (currentUser.role === 'cashier') {
      setPinPurpose('edit');
      setSelectedFactureForPrint(facture);
      setIsPinModalOpen(true);
      return;
    }
    setEditingFacture(facture);
  };

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnFacture) return;

    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, val]) => val.quantityReturned > 0)
      .map(([productId, val]) => ({
        productId,
        quantityReturned: val.quantityReturned,
        unitRefundPrice: val.unitRefundPrice,
        restockDestination: val.restockDestination,
        totalRefund: val.quantityReturned * val.unitRefundPrice,
      }));

    if (itemsToReturn.length === 0) {
      alert('Please select at least 1 item to return');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const res = await fetch('/api/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factureId: returnFacture.id,
          clientId: returnFacture.clientId,
          approvedByUserId: currentUser.id,
          reason: returnReason,
          items: itemsToReturn,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReturnFacture(null);
        fetchFactures();
      }
    } catch (err) {
      console.error('Failed to create credit note', err);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t.factures.title}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.factures.subtitle}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.factures.searchInvoices}
            className="w-full ps-10 pe-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 w-full md:w-auto shrink-0">
          {(['all', 'paid', 'returned'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`flex-1 md:flex-none px-3 py-1 text-[11px] font-semibold rounded-lg capitalize transition ${
                statusFilter === status
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {status === 'all'
                ? t.factures.filterAll
                : t.factures[status as keyof typeof t.factures] || status}
            </button>
          ))}
        </div>
      </div>

      {/* ── CLEAN Factures Table (no Tax column) ── */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">{t.factures.invoiceNo}</th>
                <th className="py-3 px-4">{t.factures.client}</th>
                <th className="py-3 px-4">{t.factures.date}</th>
                <th className="py-3 px-4 text-center">{t.factures.status}</th>
                <th className="py-3 px-4 text-end">{t.factures.amount}</th>
                <th className="py-3 px-4 text-end">{t.factures.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredFactures.map((fac) => (
                <tr
                  key={fac.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Invoice No */}
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {fac.invoiceNumber}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {fac.items.length} {t.common.items}
                      {fac.hasTva && (
                        <span className="ml-2 text-emerald-500 font-semibold">TVA 19%</span>
                      )}
                    </p>
                  </td>

                  {/* Client */}
                  <td className="py-3 px-4">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {fac.client?.name || t.pos.walkInCustomer}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {t.pos[fac.paymentMethod as keyof typeof t.pos] || fac.paymentMethod}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(fac.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={fac.status} />
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 text-end">
                    <p className="font-mono font-black text-zinc-900 dark:text-white">
                      {formatCurrency(fac.totalAmount)}
                    </p>
                    {fac.taxAmount > 0 && (
                      <p className="text-[10px] text-zinc-500 font-mono">
                        TVA: {formatCurrency(fac.taxAmount)}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit */}
                      {fac.status !== 'returned' && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(fac)}
                          className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition"
                          title="Edit Invoice"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Print */}
                      <button
                        type="button"
                        onClick={() => setSelectedFactureForPrint(fac)}
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
                        title={t.factures.printInvoice}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Return / Credit Note */}
                      {fac.status !== 'returned' && (
                        <button
                          type="button"
                          onClick={() => handleOpenReturnModal(fac)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {t.creditNotes.newCreditNote}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredFactures.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-zinc-500">
                    {t.factures.noFactures}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: EDIT FACTURE ── */}
      {editingFacture && (
        <EditFactureModal
          facture={editingFacture}
          onClose={() => setEditingFacture(null)}
          formatCurrency={formatCurrency}
          onSaved={(updated) => {
            setFactures((prev) =>
              prev.map((f) => (f.id === updated.id ? updated : f))
            );
            setEditingFacture(null);
          }}
        />
      )}

      {/* ── MODAL: CREATE RETURN / CREDIT NOTE ── */}
      {returnFacture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-base font-bold text-white">{t.creditNotes.newCreditNote}</h3>
                  <span className="text-xs text-zinc-400 font-mono">
                    {t.creditNotes.relatedInvoice}: {returnFacture.invoiceNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReturnFacture(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessReturn} className="space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  {t.creditNotes.destination}:
                </span>

                {returnFacture.items.map((it) => {
                  const state = returnItems[it.productId] || {
                    quantityReturned: 0,
                    unitRefundPrice: it.unitPrice,
                    restockDestination: 'sellable',
                  };

                  return (
                    <div
                      key={it.id}
                      className="p-3 bg-zinc-800/70 rounded-xl border border-zinc-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">
                          {it.product?.name || t.inventory.product}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-400">
                          {t.pos.qty}: {it.quantity} | {t.pos.price}: {formatCurrency(it.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-zinc-400">{t.pos.qty}:</label>
                          <input
                            type="number"
                            min="0"
                            max={it.quantity}
                            value={state.quantityReturned}
                            onChange={(e) => {
                              const val = Math.min(it.quantity, Math.max(0, Number(e.target.value)));
                              setReturnItems({
                                ...returnItems,
                                [it.productId]: { ...state, quantityReturned: val },
                              });
                            }}
                            className="w-16 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-center font-mono text-xs text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-zinc-400">{t.creditNotes.destination}:</label>
                          <select
                            value={state.restockDestination}
                            onChange={(e) => {
                              setReturnItems({
                                ...returnItems,
                                [it.productId]: {
                                  ...state,
                                  restockDestination: e.target.value as any,
                                },
                              });
                            }}
                            className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-semibold text-white focus:outline-none"
                          >
                            <option value="sellable">🟢 {t.creditNotes.sellable}</option>
                            <option value="damaged">🔴 {t.creditNotes.damaged}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  {t.creditNotes.reason}
                </label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs flex justify-between items-center text-rose-300">
                <span>{t.creditNotes.refundAmount}:</span>
                <strong className="font-mono text-base font-black">
                  {formatCurrency(
                    Object.values(returnItems).reduce(
                      (acc, i) => acc + i.quantityReturned * i.unitRefundPrice,
                      0
                    )
                  )}
                </strong>
              </div>

              <div className="flex gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setReturnFacture(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30"
                >
                  {isSubmittingReturn ? t.common.loading : t.creditNotes.newCreditNote}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice */}
      <PrintableInvoice
        facture={selectedFactureForPrint}
        isOpen={!!selectedFactureForPrint}
        onClose={() => setSelectedFactureForPrint(null)}
      />

      {/* Manager PIN Modal */}
      <ManagerPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={t.managerPin.title}
        description={t.managerPin.desc}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (pinPurpose === 'return' && selectedFactureForPrint) {
            handleOpenReturnModal(selectedFactureForPrint);
          } else if (pinPurpose === 'edit' && selectedFactureForPrint) {
            setEditingFacture(selectedFactureForPrint);
          }
        }}
      />
    </div>
  );
}
