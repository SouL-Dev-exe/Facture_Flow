import React from 'react';

interface StockBadgeProps {
  quantity: number;
  minThreshold?: number;
  showCount?: boolean;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  quantity,
  minThreshold = 5,
  showCount = true,
}) => {
  if (quantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        {showCount ? `Out of Stock (0)` : 'Out of Stock'}
      </span>
    );
  }

  if (quantity <= minThreshold) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {showCount ? `Low Stock (${quantity})` : 'Low Stock'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {showCount ? `In Stock (${quantity})` : 'In Stock'}
    </span>
  );
};
