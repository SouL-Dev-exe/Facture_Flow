'use client';

import React, { useState } from 'react';
import { ScanBarcode, Camera, Keyboard, X, Zap } from 'lucide-react';
import { Product } from '@/types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScanCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const matched = products.find(
      (p) => p.barcode === trimmed || p.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      onProductScanned(matched);
      setScanMessage(`✓ Found & Added: ${matched.name}`);
      setManualCode('');
      setTimeout(() => {
        setScanMessage(null);
        onClose();
      }, 700);
    } else {
      setScanMessage(`❌ No product found with Barcode/SKU: "${trimmed}"`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ScanBarcode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">POS Barcode Scanner</h3>
            <p className="text-xs text-zinc-400">USB Hardware / Webcam / Manual Input</p>
          </div>
        </div>

        {/* Camera Visualizer Simulation Box */}
        <div className="relative w-full h-48 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center overflow-hidden mb-5">
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 shadow-[0_0_12px_#6366f1] animate-pulse" />
          <div className="absolute inset-8 border-2 border-dashed border-zinc-700/60 rounded-lg pointer-events-none" />
          
          <Camera className="w-8 h-8 text-zinc-600 mb-2" />
          <span className="text-xs text-zinc-400 font-medium">Ready to scan barcode beam</span>
          <span className="text-[10px] text-zinc-500 mt-0.5">Focus barcode within target frame</span>
        </div>

        {/* Manual Barcode Input & Instant Test Buttons */}
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScanCode(manualCode);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Scan with USB reader or enter code..."
                className="w-full pl-3 pr-8 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <Keyboard className="w-4 h-4 text-zinc-500 absolute right-2.5 top-3" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Scan
            </button>
          </form>

          {/* Quick Barcode Simulators */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              ⚡ Quick Simulation Presets:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleScanCode(p.barcode || p.sku)}
                  className="p-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-left text-xs transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-indigo-400 font-bold text-[10px]">
                      {p.barcode || p.sku}
                    </span>
                    <Zap className="w-3 h-3 text-zinc-500 group-hover:text-amber-400" />
                  </div>
                  <p className="text-zinc-300 font-medium truncate text-[11px] mt-0.5">{p.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Status feedback */}
          {scanMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                scanMessage.startsWith('✓')
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {scanMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
