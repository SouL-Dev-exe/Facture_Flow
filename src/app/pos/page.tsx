'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Building2,
  Receipt,
  User,
  Percent,
  Lock,
  Printer,
  Sparkles,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { usePosStore } from '@/store/posStore';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';
import { Product, Category, Client, PaymentMethod, Facture } from '@/types';
import { StockBadge } from '@/components/StockBadge';
import { ManagerPinModal } from '@/components/ManagerPinModal';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { PrintableInvoice } from '@/components/PrintableInvoice';

export default function PosPage() {
  const { currentUser } = useAuthStore();
  const { t, formatCurrency } = useI18nStore();
  const {
    cart,
    selectedClient,
    globalDiscount,
    paymentMethod,
    notes,
    addToCart,
    updateItemQuantity,
    setItemPrice,
    setItemDiscount,
    removeFromCart,
    clearCart,
    setSelectedClient,
    setGlobalDiscount,
    setPaymentMethod,
    setNotes,
    getSubtotal,
    getItemDiscountTotal,
    getTaxTotal,
    getTotalAmount,
    getItemCount,
    isManagerPinModalOpen,
    openManagerPinModal,
    closeManagerPinModal,
    applyAuthorizedPinAction,
  } = usePosStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [completedFacture, setCompletedFacture] = useState<Facture | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Price override modal state for individual items
  const [overrideItem, setOverrideItem] = useState<{ productId: string; currentPrice: number } | null>(null);
  const [overrideInputPrice, setOverrideInputPrice] = useState<string>('');

  const fetchPosData = async () => {
    try {
      const [prodRes, clientsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/clients'),
      ]);
      const prodData = await prodRes.json();
      const clientsData = await clientsRes.json();

      if (prodData.success) {
        setProducts(prodData.products);
        // Extract unique categories
        const cats: Category[] = [];
        prodData.products.forEach((p: Product) => {
          if (p.category && !cats.find((c) => c.id === p.category?.id)) {
            cats.push(p.category);
          }
        });
        setCategories(cats);
      }
      if (clientsData.success) {
        setClients(clientsData.clients);
      }
    } catch (err) {
      console.error('Failed to load POS data', err);
    }
  };

  useEffect(() => {
    fetchPosData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    const res = addToCart(product, 1);
    if (!res.success) {
      setErrorMessage(res.message || 'Cannot add to cart');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handlePriceOverrideClick = (productId: string, currentPrice: number) => {
    // If Cashier, lock and prompt Manager PIN
    if (currentUser.role === 'cashier') {
      setOverrideItem({ productId, currentPrice });
      setOverrideInputPrice(currentPrice.toString());
      openManagerPinModal({
        type: 'price_override',
        productId,
        newPrice: currentPrice,
      });
    } else {
      // Manager/Admin can directly edit
      const newPriceStr = prompt('Enter authorized custom retail price ($):', currentPrice.toString());
      if (newPriceStr && !isNaN(Number(newPriceStr))) {
        setItemPrice(productId, Number(newPriceStr), true);
      }
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsProcessingCheckout(true);
    try {
      const payload = {
        clientId: selectedClient.id,
        userId: currentUser.id,
        items: cart.map((item) => {
          let itemDiscount = 0;
          const base = item.unitPrice * item.quantity;
          if (item.discount > 0) {
            itemDiscount =
              item.discountType === 'percentage'
                ? (base * item.discount) / 100
                : item.discount;
          }
          return {
            productId: item.product.id,
            quantity: item.quantity,
            unitCost: item.product.unitCost,
            unitPrice: item.unitPrice,
            discount: itemDiscount,
            totalPrice: Math.max(0, base - itemDiscount),
          };
        }),
        subtotal: getSubtotal(),
        discountAmount: globalDiscount + getItemDiscountTotal(),
        taxAmount: getTaxTotal(),
        totalAmount: getTotalAmount(),
        paymentMethod,
        notes,
      };

      const res = await fetch('/api/factures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.facture) {
        // Trigger celebratory confetti effect
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}

        setCompletedFacture(data.facture);
        clearCart();
        setIsPrintModalOpen(true);
        // Refresh catalog to update stock numbers
        fetchPosData();
      } else {
        setErrorMessage(data.message || 'Checkout failed');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server error on checkout');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6.5rem)] pb-4">
      {/* ================= LEFT SECTION: CATALOG & BARCODE SCANNER ================= */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 overflow-hidden shadow-sm">
        {/* Top Controls: Search & Barcode Trigger */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, SKU, or scan barcode..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition shrink-0"
          >
            <ScanBarcode className="w-4 h-4" />
            <span className="hidden sm:inline">Barcode Scanner</span>
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.quantitySellable <= 0;
            return (
              <button
                key={prod.id}
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(prod)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group relative overflow-hidden ${
                  isOutOfStock
                    ? 'opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700/60 hover:border-indigo-500/50 hover:shadow-md'
                }`}
              >
                {/* Product Image Thumbnail */}
                <div className="w-full h-24 rounded-lg bg-zinc-200 dark:bg-zinc-900 overflow-hidden mb-2 relative">
                  {prod.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-1 right-1">
                    <StockBadge quantity={prod.quantitySellable} minThreshold={prod.minStockThreshold} />
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase block">
                    {prod.sku}
                  </span>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight mt-0.5">
                    {prod.name}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
                  <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                    ${prod.sellingPrice.toFixed(2)}
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition">
                    <Plus className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-zinc-500">
              No products found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT SECTION: REAL-TIME POS CART ================= */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm overflow-hidden shrink-0">
        {/* Cart Header & Client Selection */}
        <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Active Order Cart
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {getItemCount()} items
            </span>
          </div>

          {/* Client Selector */}
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={selectedClient.id}
              onChange={(e) => {
                const found = clients.find((c) => c.id === e.target.value);
                if (found) setSelectedClient(found);
              }}
              className="flex-1 py-1.5 px-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.taxNumber ? `(${c.taxNumber})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items List with Stock Safety Guard */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {cart.map((item) => {
            const isOverMax = item.quantity >= item.product.quantitySellable;

            return (
              <div
                key={item.product.id}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-zinc-400">
                        Max Stock: {item.product.quantitySellable}
                      </span>
                      {item.isPriceOverridden && (
                        <span className="text-[9px] px-1.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                          Manager Override
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-zinc-400 hover:text-rose-500 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Price, Discount, and Quantity Stepper */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-200 dark:border-zinc-700/40">
                  <div className="flex items-center gap-2">
                    {/* Unit Price Button (Triggers Manager PIN if Cashier) */}
                    <button
                      type="button"
                      onClick={() =>
                        handlePriceOverrideClick(item.product.id, item.unitPrice)
                      }
                      title="Click to override item price (requires Manager PIN for Cashiers)"
                      className="font-mono font-bold text-zinc-800 dark:text-zinc-200 hover:text-indigo-500 flex items-center gap-1 group"
                    >
                      <span>${item.unitPrice.toFixed(2)}</span>
                      {currentUser.role === 'cashier' && (
                        <Lock className="w-2.5 h-2.5 text-zinc-400 group-hover:text-amber-400" />
                      )}
                    </button>
                  </div>

                  {/* Quantity Stepper with Stock Safety Guard */}
                  <div className="flex items-center gap-1.5 bg-zinc-200/70 dark:bg-zinc-900 p-1 rounded-lg">
                    <button
                      onClick={() => updateItemQuantity(item.product.id, -1)}
                      className="p-0.5 rounded hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold text-xs px-1 text-zinc-900 dark:text-zinc-100">
                      {item.quantity}
                    </span>
                    <button
                      disabled={isOverMax}
                      onClick={() => updateItemQuantity(item.product.id, 1)}
                      className="p-0.5 rounded hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400">
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs font-semibold">Cart is currently empty</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Click products on the left or scan barcodes to begin
              </p>
            </div>
          )}
        </div>

        {/* Cart Totals & Checkout Panel */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          {/* Global Discount Input */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Cart Discount ($):</span>
            <input
              type="number"
              min="0"
              value={globalDiscount || ''}
              onChange={(e) => setGlobalDiscount(Number(e.target.value) || 0)}
              placeholder="0.00"
              className="w-20 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-right font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
          </div>

          <div className="flex justify-between text-xs text-zinc-500">
            <span>Subtotal HT:</span>
            <span className="font-mono font-medium">${getSubtotal().toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs text-zinc-500">
            <span>TVA Tax (20%):</span>
            <span className="font-mono font-medium">${getTaxTotal().toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-base font-black border-t border-zinc-200 dark:border-zinc-800 pt-2 text-zinc-900 dark:text-white">
            <span>TOTAL TTC:</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              ${getTotalAmount().toFixed(2)}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1.5 pt-2">
            {(['cash', 'card', 'bank_transfer', 'cheque'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                  paymentMethod === method
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {method === 'bank_transfer' ? 'Transfer' : method}
              </button>
            ))}
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            disabled={cart.length === 0 || isProcessingCheckout}
            onClick={handleCheckout}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2"
          >
            {isProcessingCheckout ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete Sale & Print Facture
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {/* 1. Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onProductScanned={(prod) => handleAddToCart(prod)}
      />

      {/* 2. Manager PIN Authorization Modal */}
      <ManagerPinModal
        isOpen={isManagerPinModalOpen}
        onClose={closeManagerPinModal}
        title="Manager Price Override"
        description="Cashier role requires Manager authorization to modify item retail pricing or discount limits."
        onSuccess={(authManager) => {
          if (overrideItem) {
            const entered = prompt(
              `Manager PIN authorized by ${authManager.fullName}.\nEnter custom price ($):`,
              overrideItem.currentPrice.toString()
            );
            if (entered && !isNaN(Number(entered))) {
              setItemPrice(overrideItem.productId, Number(entered), true);
            }
          }
          applyAuthorizedPinAction();
        }}
      />

      {/* 3. Dual Printable Invoice Modal (A4 & 80mm Thermal Receipt) */}
      <PrintableInvoice
        facture={completedFacture}
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setCompletedFacture(null);
        }}
      />
    </div>
  );
}
