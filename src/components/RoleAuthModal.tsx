'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { UserRole } from '@/types';
import { useAuthStore } from '@/store/authStore';

interface RoleAuthModalProps {
  isOpen: boolean;
  targetRole: UserRole | null;
  onClose: () => void;
  onSuccess?: (role: UserRole) => void;
}

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  isOpen,
  targetRole,
  onClose,
  onSuccess,
}) => {
  const [credential, setCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { authenticateRoleChange } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      setCredential('');
      setError(null);
      setIsSuccess(false);
      setIsShaking(false);
    }
  }, [isOpen, targetRole]);

  if (!isOpen || !targetRole) return null;

  const roleMeta: Record<
    UserRole,
    { title: string; color: string; bg: string; border: string; demoPass: string; demoPin: string; desc: string }
  > = {
    admin: {
      title: 'Administrator',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      demoPass: 'admin123',
      demoPin: '1111',
      desc: 'Full system write access, financial valuation overrides, and snapshot management.',
    },
    manager: {
      title: 'Store Manager',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      demoPass: 'manager123',
      demoPin: '2222',
      desc: 'Stock level adjustments, returns/credit notes approval, and price override authorization.',
    },
    cashier: {
      title: 'Cashier Staff',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      demoPass: 'cashier123',
      demoPin: '3333',
      desc: 'POS register operation, barcode product scanning, and invoice printing.',
    },
  };

  const meta = roleMeta[targetRole];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential.trim()) {
      setError('Please enter the password or PIN');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await authenticateRoleChange(targetRole, credential);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsLoading(false);
        if (onSuccess) onSuccess(targetRole);
        onClose();
      }, 500);
    } else {
      setIsLoading(false);
      setError(result.message || 'Invalid authentication credentials');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleQuickFill = (val: string) => {
    setCredential(val);
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        {/* Backdrop motion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className={`relative w-full max-w-md bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl p-6 text-zinc-100 overflow-hidden backdrop-blur-xl ${
            isShaking ? 'animate-shake' : ''
          }`}
          style={{
            animation: isShaking ? 'shake 0.4s ease-in-out' : undefined,
          }}
        >
          {/* Top glowing ambient gradient */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${
              targetRole === 'admin'
                ? 'from-purple-500 to-indigo-500'
                : targetRole === 'manager'
                ? 'from-indigo-500 to-blue-500'
                : 'from-emerald-500 to-teal-500'
            }`}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Role Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${meta.bg} ${meta.border} ${meta.color}`}
            >
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-zinc-400">
                Security Verification
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                Authenticate as <span className={meta.color}>{meta.title}</span>
              </h3>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-4">{meta.desc}</p>

          {/* Quick Demo Helper */}
          <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                Default Credentials:
              </span>
              <span className="text-[10px] text-zinc-500">Click to autofill</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill(meta.demoPass)}
                className="flex-1 py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-mono text-center transition"
              >
                Password: <strong>{meta.demoPass}</strong>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill(meta.demoPin)}
                className="flex-1 py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-mono text-center transition"
              >
                PIN: <strong>{meta.demoPin}</strong>
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {isSuccess && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Authenticated successfully as {meta.title}!</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Enter Password or 4-Digit PIN
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    setError(null);
                  }}
                  placeholder={`e.g. ${meta.demoPass} or ${meta.demoPin}`}
                  className="w-full pl-3 pr-10 py-2.5 bg-zinc-900 border border-zinc-700/80 rounded-xl text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center justify-center gap-1.5 ${
                  targetRole === 'admin'
                    ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                    : targetRole === 'manager'
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirm Role Switch
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
