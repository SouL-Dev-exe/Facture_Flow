'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Product, Category } from '@/types';
import { StockBadge } from '@/components/StockBadge';
import { QuickStockAdjuster } from '@/components/QuickStockAdjuster';
import { WebpUploader } from '@/components/WebpUploader';
import { ManagerPinModal } from '@/components/ManagerPinModal';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';

export default function InventoryPage() {
  const { currentUser } = useAuthStore();
  const { t, formatCurrency } = useI18nStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWriteOffModalOpen, setIsWriteOffModalOpen] = useState(false);
  const [selectedProductForWriteOff, setSelectedProductForWriteOff] = useState<Product | null>(null);
  const [writeOffQty, setWriteOffQty] = useState(1);
  const [writeOffReason, setWriteOffReason] = useState('Damaged during storage/handling');
  const [writeOffNotes, setWriteOffNotes] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    sku: '',
    barcode: '',
    name: '',
    categoryId: '',
    unitCost: 0,
    sellingPrice: 0,
    quantitySellable: 10,
    minStockThreshold: 5,
    taxRate: 20,
    imageUrl: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        const cats: Category[] = [];
        data.products.forEach((p: Product) => {
          if (p.category && !cats.find((c) => c.id === p.category?.id)) {
            cats.push(p.category);
          }
        });
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to load inventory', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'out'
        ? p.quantitySellable <= 0
        : p.quantitySellable <= p.minStockThreshold;

    return matchesCat && matchesSearch && matchesStock;
  });

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.sku || !newProduct.name || newProduct.sellingPrice <= 0) {
      setFormError(t.inventory.required);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          actorUserId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setNewProduct({
          sku: '',
          barcode: '',
          name: '',
          categoryId: '',
          unitCost: 0,
          sellingPrice: 0,
          quantitySellable: 10,
          minStockThreshold: 5,
          taxRate: 20,
          imageUrl: '',
        });
        fetchProducts();
      } else {
        setFormError(data.message || t.common.error);
      }
    } catch (err: any) {
      setFormError(t.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWriteOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForWriteOff || writeOffQty <= 0) return;

    try {
      const res = await fetch('/api/damaged-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductForWriteOff.id,
          userId: currentUser.id,
          quantityWrittenOff: writeOffQty,
          reason: writeOffReason,
          notes: writeOffNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsWriteOffModalOpen(false);
        setSelectedProductForWriteOff(null);
        fetchProducts();
      }
    } catch (err) {
      console.error('Failed to log damaged write-off', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t.inventory.title}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.inventory.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentUser.role === 'cashier') {
                setIsPinModalOpen(true);
              } else {
                setIsAddModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            {t.inventory.addProduct}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-zinc-900/90 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.inventory.searchProducts}
            className="w-full ps-10 pe-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Select */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-48 py-2 px-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none"
        >
          <option value="all">{t.inventory.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Stock Level Filter */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 w-full md:w-auto shrink-0">
          {(['all', 'low', 'out'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStockFilter(filter)}
              className={`flex-1 md:flex-none px-3 py-1 text-[11px] font-semibold rounded-lg capitalize transition ${
                stockFilter === filter
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {filter === 'all' ? t.common.filter : filter === 'low' ? t.inventory.lowStock : t.inventory.outOfStock}
            </button>
          ))}
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">{t.inventory.product} / {t.inventory.sku}</th>
                <th className="py-3 px-4">{t.inventory.category}</th>
                <th className="py-3 px-4 text-end">{t.inventory.unitCost}</th>
                <th className="py-3 px-4 text-end">{t.inventory.sellingPrice}</th>
                <th className="py-3 px-4 text-center">{t.inventory.adjustStock}</th>
                <th className="py-3 px-4 text-center">{t.inventory.qtyDamaged}</th>
                <th className="py-3 px-4 text-center">{t.inventory.status}</th>
                <th className="py-3 px-4 text-end">{t.inventory.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredProducts.map((prod) => (
                <tr
                  key={prod.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Product & SKU */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                        {prod.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-zinc-400">
                            {prod.sku}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{prod.name}</p>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {t.inventory.sku}: {prod.sku} {prod.barcode ? `| ${t.inventory.barcode}: ${prod.barcode}` : ''}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                    {prod.category?.name || t.inventory.allCategories}
                  </td>

                  {/* Cost Price */}
                  <td className="py-3 px-4 text-end font-mono text-zinc-500 dark:text-zinc-400">
                    {formatCurrency(prod.unitCost)}
                  </td>

                  {/* Selling Price */}
                  <td className="py-3 px-4 text-end font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(prod.sellingPrice)}
                  </td>

                  {/* Quick Stock Adjuster (+1, +5, -1, -5) */}
                  <td className="py-3 px-4 text-center">
                    <QuickStockAdjuster
                      productId={prod.id}
                      currentStock={prod.quantitySellable}
                      onStockUpdated={(newStock) => {
                        setProducts((prev) =>
                          prev.map((p) =>
                            p.id === prod.id ? { ...p, quantitySellable: newStock } : p
                          )
                        );
                      }}
                      onRequestPin={() => setIsPinModalOpen(true)}
                    />
                  </td>

                  {/* Damaged Pool */}
                  <td className="py-3 px-4 text-center font-mono">
                    {prod.quantityDamaged > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {prod.quantityDamaged} {t.common.items}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-[11px]">0</span>
                    )}
                  </td>

                  {/* Smart Stock Badge */}
                  <td className="py-3 px-4 text-center">
                    <StockBadge
                      quantity={prod.quantitySellable}
                      minThreshold={prod.minStockThreshold}
                    />
                  </td>

                  {/* Actions (Write off damaged) */}
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductForWriteOff(prod);
                        setWriteOffQty(1);
                        setIsWriteOffModalOpen(true);
                      }}
                      title={t.damaged.logDamage}
                      className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition"
                    >
                      {t.inventory.damagedStock}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-zinc-500">
                    {t.inventory.noProducts}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADD NEW PRODUCT ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-white">{t.inventory.createProduct}</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {t.inventory.sku} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LAP-MAC-01"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {t.inventory.barcode}
                  </label>
                  <input
                    type="text"
                    placeholder="89345011"
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  {t.inventory.productName} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Apple Studio Display 27-inch 5K"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {t.inventory.category}
                  </label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="">{t.inventory.allCategories}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {t.inventory.qtyAvailable}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.quantitySellable}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, quantitySellable: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {t.inventory.unitCost}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newProduct.unitCost || ''}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unitCost: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {t.inventory.sellingPrice} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={newProduct.sellingPrice || ''}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {t.inventory.minThreshold}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.minStockThreshold}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, minStockThreshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* WebP Image Compressor Upload */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  {t.inventory.imageUrl}
                </label>
                <WebpUploader
                  defaultImageUrl={newProduct.imageUrl}
                  onImageCompressed={(url) => setNewProduct({ ...newProduct, imageUrl: url })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? t.common.loading : t.inventory.saveProduct}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: WRITE-OFF DAMAGED STOCK ================= */}
      {isWriteOffModalOpen && selectedProductForWriteOff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-white">{t.damaged.logDamage}</h3>
              </div>
              <button
                onClick={() => setIsWriteOffModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/60 text-xs">
              <p className="font-bold text-white">{selectedProductForWriteOff.name}</p>
              <p className="text-zinc-400 font-mono mt-0.5">
                {t.inventory.qtyAvailable}: {selectedProductForWriteOff.quantitySellable}
              </p>
              <p className="text-zinc-400 font-mono">
                {t.inventory.unitCost}: {formatCurrency(selectedProductForWriteOff.unitCost)}
              </p>
            </div>

            <form onSubmit={handleWriteOffSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  {t.damaged.qtyWrittenOff}
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProductForWriteOff.quantitySellable}
                  value={writeOffQty}
                  onChange={(e) => setWriteOffQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  {t.damaged.reason}
                </label>
                <input
                  type="text"
                  required
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  {t.damaged.notes}
                </label>
                <textarea
                  rows={2}
                  value={writeOffNotes}
                  onChange={(e) => setWriteOffNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs flex justify-between items-center text-rose-300">
                <span>{t.damaged.costLoss}:</span>
                <strong className="font-mono text-sm">
                  {formatCurrency(writeOffQty * selectedProductForWriteOff.unitCost)}
                </strong>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWriteOffModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/30"
                >
                  {t.damaged.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager PIN Modal */}
      <ManagerPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setIsAddModalOpen(true);
        }}
      />
    </div>
  );
}
