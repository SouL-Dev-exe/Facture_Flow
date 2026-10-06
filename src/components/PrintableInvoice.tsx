'use client';

import React, { useState } from 'react';
import { Printer, Receipt, FileText, X } from 'lucide-react';
import { Facture, CreditNote } from '@/types';
import { useI18nStore } from '@/store/i18nStore';

interface PrintableInvoiceProps {
  facture?: Facture | null;
  creditNote?: CreditNote | null;
  isOpen: boolean;
  onClose: () => void;
  defaultFormat?: 'a4' | 'thermal';
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({
  facture,
  creditNote,
  isOpen,
  onClose,
  defaultFormat = 'a4',
}) => {
  const { t, formatCurrency } = useI18nStore();
  const [format, setFormat] = useState<'a4' | 'thermal'>(defaultFormat);

  if (!isOpen || (!facture && !creditNote)) return null;

  const isCreditNote = !!creditNote;
  const docNumber = isCreditNote ? creditNote.creditNoteNumber : facture?.invoiceNumber;
  const docDate = new Date((isCreditNote ? creditNote.createdAt : facture?.createdAt) || '').toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const client = isCreditNote ? creditNote.client : facture?.client;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Top Header Controls (Hidden on Print) */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-800 p-1 rounded-xl border border-zinc-700">
              <button
                type="button"
                onClick={() => setFormat('a4')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  format === 'a4'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                A4
              </button>
              <button
                type="button"
                onClick={() => setFormat('thermal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  format === 'thermal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                80mm
              </button>
            </div>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded-md border border-zinc-700">
              {docNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              <Printer className="w-4 h-4" />
              {t.common.print}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Preview / Print Area */}
        <div className="p-6 overflow-y-auto flex justify-center bg-zinc-950 print:bg-white print:p-0 print:overflow-visible">
          {format === 'a4' ? (
            /* ================= A4 INVOICE LAYOUT ================= */
            <div
              id="printable-a4-area"
              className="w-full max-w-[780px] bg-white text-zinc-900 p-8 rounded-xl shadow-xl border border-zinc-200 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0"
            >
              {/* Top Banner */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                      F
                    </div>
                    <span className="text-2xl font-black tracking-tight text-zinc-950">
                      FACTURE<span className="text-indigo-600">FLOW</span>
                    </span>
                  </div>
                  <pre className="text-xs text-zinc-500 font-sans whitespace-pre-line">{t.printable.companyInfo}</pre>
                </div>

                <div className="text-end">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-md tracking-wider mb-2 ${
                      isCreditNote
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {isCreditNote ? t.printable.avoirTitle : t.printable.factureTitle}
                  </span>
                  <p className="text-xl font-mono font-bold text-zinc-900">{docNumber}</p>
                  <p className="text-xs text-zinc-500 mt-1">{t.printable.date} {docDate}</p>
                  {facture && (
                    <p className="text-xs font-semibold text-emerald-600 uppercase mt-1">
                      {t.factures.status}: {t.factures[facture.status as keyof typeof t.factures] || facture.status} ({t.pos[facture.paymentMethod as keyof typeof t.pos] || facture.paymentMethod})
                    </p>
                  )}
                </div>
              </div>

              {/* Client and Details Grid */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-zinc-50 border border-zinc-200 mb-6 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    {t.printable.billTo}
                  </span>
                  <p className="font-bold text-sm text-zinc-900">{client?.name || t.pos.walkInCustomer}</p>
                  {client?.address && <p className="text-zinc-600 mt-0.5">{client.address}</p>}
                  {client?.phone && <p className="text-zinc-600">{client.phone}</p>}
                  {client?.taxNumber && (
                    <p className="font-mono text-zinc-500 mt-1 font-medium">Tax ID / ICE: {client.taxNumber}</p>
                  )}
                </div>

                <div className="text-end flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                      {t.creditNotes.creditNoteNo}
                    </span>
                    <p className="font-mono font-medium text-zinc-700">Ref: {docNumber}</p>
                    {isCreditNote && creditNote.facture && (
                      <p className="font-mono text-zinc-600">{t.creditNotes.relatedInvoice}: {creditNote.facture.invoiceNumber}</p>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{t.common.currency}</span>
                    <p className="font-bold text-zinc-800">{t.common.currency}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-start mb-6 border-collapse">
                <thead>
                  <tr className="border-y border-zinc-300 bg-zinc-100 text-zinc-700 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-2.5 px-3">{t.printable.itemDesc}</th>
                    <th className="py-2.5 px-3 text-center">{t.printable.qty}</th>
                    <th className="py-2.5 px-3 text-end">{t.printable.unitPrice}</th>
                    <th className="py-2.5 px-3 text-end">{t.printable.discount}</th>
                    <th className="py-2.5 px-3 text-end">{t.printable.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {isCreditNote
                    ? creditNote.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-zinc-900">{item.product?.name || t.inventory.product}</p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {t.inventory.sku}: {item.product?.sku}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold">{item.quantityReturned}</td>
                          <td className="py-3 px-3 text-end font-mono">{formatCurrency(item.unitRefundPrice)}</td>
                          <td className="py-3 px-3 text-end font-mono text-zinc-400">—</td>
                          <td className="py-3 px-3 text-end font-mono font-bold text-rose-600">
                            -{formatCurrency(item.totalRefund)}
                          </td>
                        </tr>
                      ))
                    : facture?.items.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-zinc-900">{item.product?.name || t.inventory.product}</p>
                            <span className="text-[10px] text-zinc-500 font-mono">{t.inventory.sku}: {item.product?.sku}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold">{item.quantity}</td>
                          <td className="py-3 px-3 text-end font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-3 text-end font-mono text-amber-600">
                            {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-end font-mono font-bold">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2 text-xs">
                  {facture && (
                    <>
                      <div className="flex justify-between text-zinc-600">
                        <span>{t.printable.subtotal}:</span>
                        <span className="font-mono font-medium">{formatCurrency(facture.subtotal)}</span>
                      </div>
                      {facture.discountAmount > 0 && (
                        <div className="flex justify-between text-amber-600 font-medium">
                          <span>{t.printable.discount}:</span>
                          <span className="font-mono">-{formatCurrency(facture.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-zinc-600">
                        <span>{t.printable.tax}:</span>
                        <span className="font-mono font-medium">{formatCurrency(facture.taxAmount)}</span>
                      </div>
                      <div className="border-t-2 border-zinc-900 pt-2 flex justify-between text-base font-black text-zinc-950">
                        <span>{t.printable.grandTotal}:</span>
                        <span className="font-mono text-indigo-700">{formatCurrency(facture.totalAmount)}</span>
                      </div>
                    </>
                  )}

                  {isCreditNote && (
                    <div className="border-t-2 border-rose-600 pt-2 flex justify-between text-base font-black text-rose-700">
                      <span>{t.creditNotes.totalRefunded}:</span>
                      <span className="font-mono">{formatCurrency(creditNote.totalRefundAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature & Legal Notice */}
              <div className="border-t border-zinc-200 pt-6 grid grid-cols-2 gap-8 text-[11px] text-zinc-500">
                <div>
                  <p className="font-semibold text-zinc-700 mb-1">{t.printable.thankYou}</p>
                  {isCreditNote && creditNote.reason && (
                    <p className="mt-1 text-rose-600 font-medium">{t.creditNotes.reason}: {creditNote.reason}</p>
                  )}
                </div>
                <div className="text-end">
                  <p className="font-semibold text-zinc-700 mb-8">{t.printable.signature}</p>
                  <div className="border-b border-zinc-300 w-48 ms-auto" />
                </div>
              </div>
            </div>
          ) : (
            /* ================= 80MM THERMAL RECEIPT LAYOUT ================= */
            <div
              id="printable-thermal-area"
              className="w-[300px] bg-white text-black p-4 font-mono text-xs shadow-2xl rounded-sm border border-zinc-200 print:shadow-none print:border-none print:w-[80mm] print:p-2"
            >
              <div className="text-center pb-3 border-b border-dashed border-black mb-3">
                <p className="font-black text-base tracking-wider">FACTUREFLOW POS</p>
                <p className="text-[10px]">{t.header.currentlyActive}</p>
                <p className="text-[10px] mt-1">{docDate}</p>
                <p className="font-bold mt-1 text-[11px]">{docNumber}</p>
              </div>

              <div className="mb-2 text-[10px]">
                <p>{t.pos.client}: {client?.name || t.pos.walkInCustomer}</p>
                {facture && <p>{t.roles.cashier}: {facture.user?.fullName || 'POS Staff'}</p>}
              </div>

              <div className="border-b border-dashed border-black pb-2 mb-2">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-black text-start">
                      <th>{t.pos.qty}</th>
                      <th className="text-center">{t.inventory.product}</th>
                      <th className="text-end">{t.pos.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isCreditNote
                      ? creditNote.items.map((i) => (
                          <tr key={i.id}>
                            <td className="py-1">{i.quantityReturned}x</td>
                            <td className="text-center">{i.product?.name?.slice(0, 14)}</td>
                            <td className="text-end font-bold">-{formatCurrency(i.totalRefund)}</td>
                          </tr>
                        ))
                      : facture?.items.map((i) => (
                          <tr key={i.id}>
                            <td className="py-1">{i.quantity}x</td>
                            <td className="text-center">{i.product?.name?.slice(0, 14)}</td>
                            <td className="text-end font-bold">{formatCurrency(i.totalPrice)}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>

              {facture && (
                <div className="space-y-1 text-end text-[11px] mb-3">
                  <div className="flex justify-between">
                    <span>{t.pos.subtotal}:</span>
                    <span>{formatCurrency(facture.subtotal)}</span>
                  </div>
                  {facture.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span>{t.pos.discount}:</span>
                      <span>-{formatCurrency(facture.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t.pos.tax}:</span>
                    <span>{formatCurrency(facture.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm border-t border-black pt-1">
                    <span>{t.pos.grandTotal}:</span>
                    <span>{formatCurrency(facture.totalAmount)}</span>
                  </div>
                </div>
              )}

              {isCreditNote && (
                <div className="flex justify-between font-black text-sm border-t border-black pt-1 mb-3">
                  <span>{t.creditNotes.totalRefunded}:</span>
                  <span>{formatCurrency(creditNote.totalRefundAmount)}</span>
                </div>
              )}

              <div className="text-center border-t border-dashed border-black pt-3 text-[10px]">
                <p>{t.pos.paymentMethod}: {t.pos[facture?.paymentMethod as keyof typeof t.pos] || facture?.paymentMethod}</p>
                <p className="mt-1 font-bold">{t.printable.thankYou}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
