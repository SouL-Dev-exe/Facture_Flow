import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { initialUsers } from '@/lib/mock-data';

interface AuthState {
  currentUser: User;
  users: User[];
  setUserRole: (role: UserRole) => void;
  setUser: (user: User) => void;
  verifyPinCode: (pin: string) => Promise<{ success: boolean; message?: string; user?: User }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialUsers[1], // Default to Manager (Alex Vance) for easy preview of full privileges
  users: initialUsers,
  setUserRole: (role: UserRole) => {
    const matched = get().users.find((u) => u.role === role) || {
      id: `user-${role}-custom`,
      fullName: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
      email: `${role}@factureflow.com`,
      role,
      pinCode: role === 'admin' ? '1234' : role === 'manager' ? '9999' : '0000',
      createdAt: new Date().toISOString(),
    };
    set({ currentUser: matched });
  },
  setUser: (user: User) => set({ currentUser: user }),
  verifyPinCode: async (pin: string) => {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, allowedRoles: ['admin', 'manager'] }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      // Offline fallback
      const adminOrManager = get().users.find(
        (u) => u.pinCode === pin && (u.role === 'admin' || u.role === 'manager')
      );
      if (adminOrManager) {
        return { success: true, user: adminOrManager };
      }
      return { success: false, message: 'Invalid Manager/Admin PIN' };
    }
  },
}));
