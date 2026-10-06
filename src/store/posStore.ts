import { create } from 'zustand';
import { Product, CartItem, Client, PaymentMethod } from '@/types';
import { initialClients } from '@/lib/mock-data';

interface PosState {
  cart: CartItem[];
  selectedClient: Client;
  globalDiscount: number; // overall cart discount amount
  paymentMethod: PaymentMethod;
  notes: string;
  isCheckingOut: boolean;
  isManagerPinModalOpen: boolean;
  pinActionPending: {
    type: 'price_override' | 'custom_discount';
    productId: string;
    newPrice?: number;
    newDiscount?: number;
  } | null;
  barcodeScanQuery: string;

  // Actions
  addToCart: (product: Product, quantity?: number) => { success: boolean; message?: string };
  updateItemQuantity: (productId: string, delta: number) => boolean;
  setItemQuantity: (productId: string, quantity: number) => boolean;
  setItemPrice: (productId: string, newPrice: number, isAuthorized?: boolean) => boolean;
  setItemDiscount: (productId: string, discount: number, discountType: 'percentage' | 'fixed') => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setSelectedClient: (client: Client) => void;
  setGlobalDiscount: (discount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNotes: (notes: string) => void;
  setIsCheckingOut: (val: boolean) => void;
  openManagerPinModal: (pendingAction: PosState['pinActionPending']) => void;
  closeManagerPinModal: () => void;
  applyAuthorizedPinAction: () => void;

  // Calculations
  getSubtotal: () => number;
  getItemDiscountTotal: () => number;
  getTaxTotal: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  selectedClient: initialClients[3] || initialClients[0], // Walk-in client default
  globalDiscount: 0,
  paymentMethod: 'cash',
  notes: '',
  isCheckingOut: false,
  isManagerPinModalOpen: false,
  pinActionPending: null,
  barcodeScanQuery: '',

  addToCart: (product: Product, quantity = 1) => {
    const { cart } = get();
    if (product.quantitySellable <= 0) {
      return { success: false, message: `"${product.name}" is completely out of stock!` };
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + quantity > product.quantitySellable) {
        return {
          success: false,
          message: `Cannot add more. Sellable stock limit reached (${product.quantitySellable} units max).`,
        };
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      set({ cart: updatedCart });
      return { success: true };
    } else {
      if (quantity > product.quantitySellable) {
        return {
          success: false,
          message: `Only ${product.quantitySellable} units available in stock.`,
        };
      }
      const newItem: CartItem = {
        product,
        quantity,
        unitPrice: product.sellingPrice,
        originalPrice: product.sellingPrice,
        discount: 0,
        discountType: 'percentage',
        taxRate: product.taxRate || 20,
      };
      set({ cart: [...cart, newItem] });
      return { success: true };
    }
  },

  updateItemQuantity: (productId: string, delta: number) => {
    const { cart } = get();
    const index = cart.findIndex((item) => item.product.id === productId);
    if (index === -1) return false;

    const currentItem = cart[index];
    const newQty = currentItem.quantity + delta;

    if (newQty <= 0) {
      get().removeFromCart(productId);
      return true;
    }

    if (newQty > currentItem.product.quantitySellable) {
      return false;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = newQty;
    set({ cart: updatedCart });
    return true;
  },

  setItemQuantity: (productId: string, quantity: number) => {
    const { cart } = get();
    const index = cart.findIndex((item) => item.product.id === productId);
    if (index === -1) return false;

    const currentItem = cart[index];
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return true;
    }

    if (quantity > currentItem.product.quantitySellable) {
      return false;
    }

    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    set({ cart: updatedCart });
    return true;
  },

  setItemPrice: (productId: string, newPrice: number, isAuthorized = false) => {
    const { cart } = get();
    const index = cart.findIndex((item) => item.product.id === productId);
    if (index === -1) return false;

    if (!isAuthorized) {
      // Need Manager Authorization
      get().openManagerPinModal({
        type: 'price_override',
        productId,
        newPrice,
      });
      return false;
    }

    const updatedCart = [...cart];
    updatedCart[index].unitPrice = Math.max(0, newPrice);
    updatedCart[index].isPriceOverridden = true;
    set({ cart: updatedCart });
    return true;
  },

  setItemDiscount: (productId: string, discount: number, discountType: 'percentage' | 'fixed') => {
    const { cart } = get();
    const index = cart.findIndex((item) => item.product.id === productId);
    if (index === -1) return;

    const updatedCart = [...cart];
    updatedCart[index].discount = Math.max(0, discount);
    updatedCart[index].discountType = discountType;
    set({ cart: updatedCart });
  },

  removeFromCart: (productId: string) => {
    const { cart } = get();
    set({ cart: cart.filter((item) => item.product.id !== productId) });
  },

  clearCart: () => {
    set({
      cart: [],
      globalDiscount: 0,
      notes: '',
      isCheckingOut: false,
    });
  },

  setSelectedClient: (client: Client) => set({ selectedClient: client }),
  setGlobalDiscount: (discount: number) => set({ globalDiscount: Math.max(0, discount) }),
  setPaymentMethod: (method: PaymentMethod) => set({ paymentMethod: method }),
  setNotes: (notes: string) => set({ notes }),
  setIsCheckingOut: (val: boolean) => set({ isCheckingOut: val }),

  openManagerPinModal: (pendingAction) =>
    set({ isManagerPinModalOpen: true, pinActionPending: pendingAction }),

  closeManagerPinModal: () => set({ isManagerPinModalOpen: false, pinActionPending: null }),

  applyAuthorizedPinAction: () => {
    const { pinActionPending, cart } = get();
    if (!pinActionPending) return;

    if (pinActionPending.type === 'price_override' && pinActionPending.newPrice !== undefined) {
      const index = cart.findIndex((item) => item.product.id === pinActionPending.productId);
      if (index !== -1) {
        const updatedCart = [...cart];
        updatedCart[index].unitPrice = Math.max(0, pinActionPending.newPrice);
        updatedCart[index].isPriceOverridden = true;
        set({ cart: updatedCart });
      }
    }
    set({ isManagerPinModalOpen: false, pinActionPending: null });
  },

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce((acc, item) => {
      let itemTotal = item.unitPrice * item.quantity;
      if (item.discount > 0) {
        if (item.discountType === 'percentage') {
          itemTotal -= (itemTotal * item.discount) / 100;
        } else {
          itemTotal -= Math.min(itemTotal, item.discount);
        }
      }
      return acc + Math.max(0, itemTotal);
    }, 0);
  },

  getItemDiscountTotal: () => {
    const { cart } = get();
    return cart.reduce((acc, item) => {
      const base = item.unitPrice * item.quantity;
      let disc = 0;
      if (item.discount > 0) {
        if (item.discountType === 'percentage') {
          disc = (base * item.discount) / 100;
        } else {
          disc = Math.min(base, item.discount);
        }
      }
      return acc + disc;
    }, 0);
  },

  getTaxTotal: () => {
    const { cart, globalDiscount } = get();
    const subtotal = get().getSubtotal();
    const discountedSubtotal = Math.max(0, subtotal - globalDiscount);

    // Calculate effective weighted tax
    if (subtotal === 0) return 0;
    const ratio = discountedSubtotal / subtotal;

    return cart.reduce((acc, item) => {
      let itemNet = item.unitPrice * item.quantity;
      if (item.discount > 0) {
        if (item.discountType === 'percentage') {
          itemNet -= (itemNet * item.discount) / 100;
        } else {
          itemNet -= Math.min(itemNet, item.discount);
        }
      }
      itemNet *= ratio;
      const tax = (itemNet * item.taxRate) / 100;
      return acc + tax;
    }, 0);
  },

  getTotalAmount: () => {
    const subtotal = get().getSubtotal();
    const { globalDiscount } = get();
    const tax = get().getTaxTotal();
    return Math.max(0, subtotal - globalDiscount + tax);
  },

  getItemCount: () => {
    const { cart } = get();
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  },
}));
