'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Loader2, Plus, Minus, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface QuickStockAdjusterProps {
  productId: string;
  currentStock: number;
  onStockUpdated: (newStock: number) => void;
  onRequestPin?: () => void;
}

export const QuickStockAdjuster: React.FC<QuickStockAdjusterProps> = ({
  productId,
  currentStock,
  onStockUpdated,
  onRequestPin,
}) => {
  const { currentUser } = useAuthStore();
  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'stocker';

  const [delta, setDelta] = useState<string>('');
  const [mode, setMode] = useState<'add' | 'sub'>('add');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Clear feedback after 1.8s
  useEffect(() => {
    if (feedback) {
      feedbackTimer.current = setTimeout(() => setFeedback(null), 1800);
    }
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, [feedback]);

  // Computed delta as a signed number
  const parsedDelta = () => {
    const abs = Math.abs(Number(delta) || 0);
    return mode === 'add' ? abs : -abs;
  };

  const previewStock = Math.max(0, currentStock + parsedDelta());

  const handleApply = async () => {
    if (!isAuthorized) {
      if (onRequestPin) onRequestPin();
      return;
    }

    const signed = parsedDelta();
    if (signed === 0 || !delta.trim()) return;
    if (currentStock + signed < 0) {
      setFeedback('error');
      return;
    }

    setIsUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          deltaQty: signed,
          actorUserId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        onStockUpdated(data.product.quantitySellable);
        setDelta('');
        setFeedback('success');
        inputRef.current?.blur();
      } else {
        setFeedback('error');
      }
    } catch {
      setFeedback('error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Allow submitting with Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApply();
  };

  // Unauthorized state — locked icon
  if (!isAuthorized) {
    return (
      <button
        type="button"
        onClick={() => onRequestPin?.()}
        title="Manager / Admin PIN required to adjust stock"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
      >
        <Lock className="w-3 h-3" />
        <span className="font-mono">{currentStock}</span>
      </button>
    );
  }

  const hasValue = delta.trim() !== '' && Number(delta) !== 0;
  const wouldGoNegative = currentStock + parsedDelta() < 0;

  return (
    <div className="inline-flex items-center gap-1.5">
      {/* Add / Subtract toggle */}
      <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
        <button
          type="button"
          onClick={() => setMode('add')}
          title="Add stock"
          className={`px-1.5 py-1 transition ${
            mode === 'add'
              ? 'bg-emerald-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500'
          }`}
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => setMode('sub')}
          title="Subtract stock"
          className={`px-1.5 py-1 transition border-l border-zinc-200 dark:border-zinc-700 ${
            mode === 'sub'
              ? 'bg-rose-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500'
          }`}
        >
          <Minus className="w-3 h-3" />
        </button>
      </div>

      {/* Current stock display */}
      <span
        className={`font-mono text-xs font-bold tabular-nums min-w-[2rem] text-center transition-colors ${
          hasValue
            ? wouldGoNegative
              ? 'text-rose-500'
              : mode === 'add'
              ? 'text-emerald-500'
              : 'text-amber-400'
            : 'text-zinc-800 dark:text-zinc-100'
        }`}
        title={hasValue ? `Will become: ${previewStock}` : 'Current stock'}
      >
        {hasValue ? previewStock : currentStock}
      </span>

      {/* Quantity input */}
      <input
        ref={inputRef}
        type="number"
        min="1"
        step="1"
        value={delta}
        onChange={(e) => setDelta(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={handleKeyDown}
        placeholder="qty"
        className={`w-14 px-2 py-1 rounded-lg border text-xs font-mono text-center focus:outline-none transition ${
          wouldGoNegative && hasValue
            ? 'border-rose-500/60 bg-rose-500/10 text-rose-400'
            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 focus:border-indigo-500'
        }`}
      />

      {/* Apply button */}
      <button
        type="button"
        onClick={handleApply}
        disabled={isUpdating || !hasValue || wouldGoNegative}
        title={
          wouldGoNegative
            ? 'Cannot subtract more than available stock'
            : `Apply ${mode === 'add' ? '+' : '-'}${delta || 0} to stock`
        }
        className={`p-1.5 rounded-lg transition flex items-center justify-center disabled:opacity-40 ${
          feedback === 'success'
            ? 'bg-emerald-500 text-white'
            : feedback === 'error'
            ? 'bg-rose-500 text-white'
            : hasValue && !wouldGoNegative
            ? mode === 'add'
              ? 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/30'
              : 'bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
        }`}
      >
        {isUpdating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : feedback === 'success' ? (
          <Check className="w-3 h-3" />
        ) : (
          <Check className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};
