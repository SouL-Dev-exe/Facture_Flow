'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
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
  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'manager';
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAdjust = async (delta: number) => {
    if (!isAuthorized) {
      if (onRequestPin) onRequestPin();
      return;
    }

    if (currentStock + delta < 0) return;

    setIsUpdating(true);
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          deltaQty: delta,
          actorUserId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.product) {
        onStockUpdated(data.product.quantitySellable);
      }
    } catch (err) {
      console.error('Failed to adjust stock', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700/60 shadow-sm">
      <button
        type="button"
        disabled={isUpdating || currentStock < 5}
        onClick={() => handleAdjust(-5)}
        title={isAuthorized ? 'Decrease by 5' : 'Manager PIN required'}
        className="px-1.5 py-0.5 text-xs font-mono font-medium rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition"
      >
        -5
      </button>
      <button
        type="button"
        disabled={isUpdating || currentStock < 1}
        onClick={() => handleAdjust(-1)}
        title={isAuthorized ? 'Decrease by 1' : 'Manager PIN required'}
        className="p-1 rounded hover:bg-rose-500/10 hover:text-rose-500 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition"
      >
        <Minus className="w-3 h-3" />
      </button>

      <span className="px-2 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-100">
        {currentStock}
      </span>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => handleAdjust(1)}
        title={isAuthorized ? 'Increase by 1' : 'Manager PIN required'}
        className="p-1 rounded hover:bg-emerald-500/10 hover:text-emerald-500 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition"
      >
        <Plus className="w-3 h-3" />
      </button>
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => handleAdjust(5)}
        title={isAuthorized ? 'Increase by 5' : 'Manager PIN required'}
        className="px-1.5 py-0.5 text-xs font-mono font-medium rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition"
      >
        +5
      </button>
    </div>
  );
};
