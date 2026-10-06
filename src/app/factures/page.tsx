'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Printer,
  RotateCcw,
  X,
} from 'lucide-react';
import { Facture } from '@/types';
import { PrintableInvoice } from '@/components/PrintableInvoice';
import { ManagerPinModal } from '@/components/ManagerPinModal';
import { useAuthStore } from '@/store/authStore';
import { useI18nStore } from '@/store/i18nStore';

export default function FacturesPage() {
  const { currentUser } = useAuthStore();
  const { t, formatCurrency } = useI18nStore();
  const [factures, setFactures] = useState<Facture[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFactureForPrint, setSelectedFactureForPrint] = useState<Facture | null>(null);

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
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const fetchFactures = async () => {
    try {
      const res = await fetch('/api/factures');
      const data = await res.json();
      if (data.success) {
        setFactures(data.factures);
      }
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

  const handleOpenReturnModal = (facture: Facture) => {
    if (currentUser.role === 'cashier') {
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
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.factures.subtitle}
          </p>
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
              {status === 'all' ? t.factures.filterAll : t.factures[status as keyof typeof t.factures] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Factures List Table */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">{t.factures.invoiceNo}</th>
                <th className="py-3 px-4">{t.factures.client}</th>
                <th className="py-3 px-4">{t.factures.date}</th>
                <th className="py-3 px-4">{t.common.items}</th>
                <th className="py-3 px-4 text-end">{t.pos.subtotal}</th>
                <th className="py-3 px-4 text-end">{t.pos.tax}</th>
                <th className="py-3 px-4 text-end">{t.factures.amount}</th>
                <th className="py-3 px-4 text-center">{t.factures.status}</th>
                <th className="py-3 px-4 text-end">{t.factures.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredFactures.map((fac) => (
                <tr
                  key={fac.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {fac.invoiceNumber}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {fac.client?.name || t.pos.walkInCustomer}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {t.pos[fac.paymentMethod as keyof typeof t.pos] || fac.paymentMethod}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(fac.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  <td className="py-3 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                    {fac.items.length} {t.common.items}
                  </td>

                  <td className="py-3 px-4 text-end font-mono text-zinc-500">
                    {formatCurrency(fac.subtotal)}
                  </td>

                  <td className="py-3 px-4 text-end font-mono text-zinc-500">
                    {formatCurrency(fac.taxAmount)}
                  </td>

                  <td className="py-3 px-4 text-end font-mono font-black text-zinc-900 dark:text-white">
                    {formatCurrency(fac.totalAmount)}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        fac.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : fac.status === 'returned'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}
                    >
                      {t.factures[fac.status as keyof typeof t.factures] || fac.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedFactureForPrint(fac)}
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
                        title={t.factures.printInvoice}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

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
                  <td colSpan={9} className="py-12 text-center text-xs text-zinc-500">
                    {t.factures.noFactures}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: CREATE RETURN / CREDIT NOTE (AVOIR) ================= */}
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
                        <p className="font-bold text-white truncate">{it.product?.name || t.inventory.product}</p>
                        <p className="text-[10px] font-mono text-zinc-400">
                          {t.pos.qty}: {it.quantity} | {t.pos.price}: {formatCurrency(it.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Return Qty */}
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

                        {/* Stock Destination Routing */}
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

      {/* Printable Invoice & Thermal Receipt Modal */}
      <PrintableInvoice
        facture={selectedFactureForPrint}
        isOpen={!!selectedFactureForPrint}
        onClose={() => setSelectedFactureForPrint(null)}
      />

      {/* Manager PIN Authorization Modal */}
      <ManagerPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title={t.managerPin.title}
        description={t.managerPin.desc}
        onSuccess={() => {
          setIsPinModalOpen(false);
          if (selectedFactureForPrint) {
            handleOpenReturnModal(selectedFactureForPrint);
          }
        }}
      />
    </div>
  );
}
