'use client';

import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface ManagerPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (authorizedUser: any) => void;
  title?: string;
  description?: string;
}

export const ManagerPinModal: React.FC<ManagerPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Manager Authorization Required',
  description = 'This privileged action requires a Manager or Admin PIN code.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { verifyPinCode } = useAuthStore();

  if (!isOpen) return null;

  const handleKeyClick = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyPinCode(pin);
      if (result.success && result.user) {
        onSuccess(result.user);
        setPin('');
        onClose();
      } else {
        setError(result.message || 'Invalid PIN code. Access denied.');
      }
    } catch (err: any) {
      setError('Authorization error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-400">{description}</p>
          </div>
        </div>

        {/* Demo Helper Hint */}
        <div className="mb-5 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
          <span>💡 Quick Demo PINs:</span>
          <span className="font-mono text-zinc-200">Manager: <strong>9999</strong> | Admin: <strong>1234</strong></span>
        </div>

        {/* PIN Display */}
        <div className="flex justify-center items-center gap-3 mb-5">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
                  isFilled
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-inner'
                    : 'border-zinc-700 bg-zinc-800/60 text-zinc-600'
                }`}
              >
                {isFilled ? '●' : ''}
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="py-3 text-lg font-semibold rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-indigo-600 active:text-white border border-zinc-700/50 transition-all text-zinc-200"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 text-xs font-semibold rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 border border-zinc-700/40 transition-all"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="py-3 text-lg font-semibold rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 active:bg-indigo-600 text-zinc-200 border border-zinc-700/50 transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 text-xs font-semibold rounded-xl bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 border border-zinc-700/40 transition-all"
          >
            ⌫
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pin.length === 0 || isLoading}
            onClick={() => handleSubmit()}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Authorize Action
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
