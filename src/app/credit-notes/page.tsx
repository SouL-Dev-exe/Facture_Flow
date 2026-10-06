'use client';

import React, { useState, useEffect } from 'react';
import { Search, Printer, ShieldCheck } from 'lucide-react';
import { CreditNote } from '@/types';
import { PrintableInvoice } from '@/components/PrintableInvoice';
import { useI18nStore } from '@/store/i18nStore';

export default function CreditNotesPage() {
  const { t, formatCurrency } = useI18nStore();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteForPrint, setSelectedNoteForPrint] = useState<CreditNote | null>(null);

  const fetchCreditNotes = async () => {
    try {
      const res = await fetch('/api/credit-notes');
      const data = await res.json();
      if (data.success) {
        setCreditNotes(data.creditNotes);
      }
    } catch (err) {
      console.error('Failed to load credit notes', err);
    }
  };

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const filteredNotes = creditNotes.filter((cn) => {
    const matchesSearch =
      searchQuery === '' ||
      cn.creditNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cn.client?.name && cn.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cn.facture?.invoiceNumber &&
        cn.facture.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t.creditNotes.title}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t.creditNotes.subtitle}
          </p>
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
            placeholder={t.creditNotes.searchCreditNotes}
            className="w-full ps-10 pe-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Credit Notes Table */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">{t.creditNotes.creditNoteNo}</th>
                <th className="py-3 px-4">{t.creditNotes.relatedInvoice}</th>
                <th className="py-3 px-4">{t.creditNotes.client}</th>
                <th className="py-3 px-4">{t.creditNotes.date}</th>
                <th className="py-3 px-4">{t.creditNotes.approvedBy}</th>
                <th className="py-3 px-4">{t.inventory.product}</th>
                <th className="py-3 px-4 text-end">{t.creditNotes.refundAmount}</th>
                <th className="py-3 px-4 text-end">{t.creditNotes.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredNotes.map((cn) => (
                <tr
                  key={cn.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-rose-500 dark:text-rose-400">
                    {cn.creditNoteNumber}
                  </td>
                  <td className="py-3 px-4 font-mono text-indigo-500 dark:text-indigo-400">
                    {cn.facture?.invoiceNumber || '—'}
                  </td>
                  <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {cn.client?.name || t.pos.walkInCustomer}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                    {new Date(cn.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      {cn.approvedBy?.fullName || t.roles.manager}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {cn.items.map((it) => (
                        <div key={it.id} className="text-[11px] flex items-center gap-2">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {it.product?.name || t.inventory.product} ({it.quantityReturned}x)
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              it.restockDestination === 'sellable'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-rose-500/15 text-rose-500'
                            }`}
                          >
                            {it.restockDestination === 'sellable' ? t.creditNotes.sellable : t.creditNotes.damaged}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                    {formatCurrency(cn.totalRefundAmount)}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => setSelectedNoteForPrint(cn)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition inline-flex items-center gap-1.5 text-[11px] font-semibold"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      {t.creditNotes.printCreditNote}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredNotes.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-zinc-500">
                    {t.creditNotes.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Credit Note Document Modal */}
      <PrintableInvoice
        creditNote={selectedNoteForPrint}
        isOpen={!!selectedNoteForPrint}
        onClose={() => setSelectedNoteForPrint(null)}
      />
    </div>
  );
}
