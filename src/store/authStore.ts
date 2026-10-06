import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { initialUsers } from '@/lib/mock-data';

interface AuthState {
  currentUser: User;
  users: User[];
  setUserRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  authenticateRoleChange: (
    targetRole: UserRole,
    credential: string
  ) => Promise<{ success: boolean; message?: string; user?: User }>;
  verifyPinCode: (
    pin: string,
    allowedRoles?: UserRole[]
  ) => Promise<{ success: boolean; message?: string; user?: User }>;
}

const STORAGE_KEY = 'factureflow_active_user';

// Helper to get initial stored user safely in SSR
const getInitialUser = (): User => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse stored user from localStorage');
    }
  }
  return initialUsers[1]; // Default to Manager (Alex Vance)
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialUsers[1],
  users: initialUsers,

  setUserRole: (role: UserRole) => {
    const matched = get().users.find((u) => u.role === role) || {
      id: `user-${role}-custom`,
      fullName: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
      email: `${role}@factureflow.com`,
      role,
      pinCode: role === 'admin' ? '1111' : role === 'manager' ? '2222' : '3333',
      createdAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(matched));
      } catch (e) {}
    }
    set({ currentUser: matched });
  },

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (e) {}
    }
    set({ currentUser: user });
  },

  authenticateRoleChange: async (targetRole: UserRole, credential: string) => {
    const trimmed = credential.trim();
    if (!trimmed) {
      return { success: false, message: 'Please enter a Password or 4-digit PIN' };
    }

    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          credential: trimmed,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        get().setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Authentication failed' };
    } catch (err: any) {
      // Offline fallback verification
      const user = get().users.find((u) => u.role === targetRole);
      const isDefaultValid =
        (targetRole === 'admin' && (trimmed === 'admin123' || trimmed === '1111' || trimmed === '1234')) ||
        (targetRole === 'manager' && (trimmed === 'manager123' || trimmed === '2222' || trimmed === '9999')) ||
        (targetRole === 'cashier' && (trimmed === 'cashier123' || trimmed === '3333' || trimmed === '0000'));

      if (user && isDefaultValid) {
        get().setUser(user);
        return { success: true, user };
      }
      return { success: false, message: `Incorrect Password or PIN for ${targetRole.toUpperCase()}` };
    }
  },

  verifyPinCode: async (pin: string, allowedRoles = ['admin', 'manager'] as UserRole[]) => {
    const trimmed = pin.trim();
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmed, allowedRoles }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      // Offline fallback
      const adminOrManager = get().users.find(
        (u) =>
          allowedRoles.includes(u.role) &&
          (u.pinCode === trimmed ||
            u.password === trimmed ||
            (u.role === 'admin' && (trimmed === '1111' || trimmed === 'admin123' || trimmed === '1234')) ||
            (u.role === 'manager' && (trimmed === '2222' || trimmed === 'manager123' || trimmed === '9999')))
      );
      if (adminOrManager) {
        return { success: true, user: adminOrManager };
      }
      return { success: false, message: 'Invalid Manager/Admin PIN' };
    }
  },
}));
