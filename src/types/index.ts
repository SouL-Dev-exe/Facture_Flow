export type UserRole = 'admin' | 'manager' | 'cashier' | 'stocker';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  pinCode?: string;
  password?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  categoryId?: string | null;
  category?: Category | null;
  unitCost: number;
  sellingPrice: number;
  quantitySellable: number;
  quantityDamaged: number;
  minStockThreshold: number;
  taxRate: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  balance: number;
  createdAt: string;
}

export type FactureStatus = 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'returned';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'cheque';

export interface FactureItem {
  id: string;
  factureId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

export interface Facture {
  id: string;
  invoiceNumber: string;
  clientId?: string | null;
  client?: Client | null;
  userId?: string | null;
  user?: User | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  hasTva: boolean;
  status: FactureStatus;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  createdAt: string;
  items: FactureItem[];
  creditNotes?: CreditNote[];
}

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  productId: string;
  product?: Product;
  quantityReturned: number;
  unitRefundPrice: number;
  restockDestination: 'sellable' | 'damaged';
  totalRefund: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  factureId: string;
  facture?: Facture;
  clientId?: string | null;
  client?: Client | null;
  approvedByUserId?: string | null;
  approvedBy?: User | null;
  totalRefundAmount: number;
  reason?: string | null;
  createdAt: string;
  items: CreditNoteItem[];
}

export interface DamagedStockLog {
  id: string;
  productId: string;
  product?: Product;
  userId?: string | null;
  user?: User | null;
  quantityWrittenOff: number;
  costLossValue: number;
  reason: string;
  notes?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: User | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface DailyStockSnapshot {
  id: string;
  snapshotDate: string;
  totalItemsCount: number;
  totalStockQty: number;
  totalCostValuation: number;
  totalRetailValuation: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discount: number; // percentage or fixed
  discountType: 'percentage' | 'fixed';
  taxRate: number;
  isPriceOverridden?: boolean;
}

export type AnalyticsTimeframe = 'daily' | 'monthly' | 'yearly';

export interface TopProductMetric {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  unitsSold: number;
  totalRevenue: number;
  profit: number;
}

export interface TopCategoryMetric {
  id: string;
  name: string;
  unitsSold: number;
  totalRevenue: number;
}

export interface EmployeePerformanceMetric {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  facturesCount: number;
  totalRevenue: number;
  averageBasket: number;
}

export interface HourlySalesMetric {
  hour: string; // e.g., '09:00', '10:00'
  revenue: number;
  ordersCount: number;
}

export interface MonthlyTrendMetric {
  month: string; // e.g., 'May', 'Jun'
  revenue: number;
  cost: number;
  netProfit: number;
  tvaCollected: number;
}

export interface PaymentBreakdown {
  cash: number;
  card: number;
  bankTransfer: number;
  cheque: number;
}

export interface AnalyticsSummary {
  // Global valuation & warehouse
  totalInventoryCost: number;
  totalRetailValuation: number;
  unrealizedProfit: number;
  unrealizedProfitMargin: number;
  totalProductsCount: number;
  totalStockQuantity: number;
  totalDamagedQuantity: number;
  damagedGoodsCostLoss: number;
  lowStockItemsCount: number;
  outOfStockCount: number;

  // Timeframe-specific metrics (computed based on selected timeframe)
  timeframe: AnalyticsTimeframe;
  revenue: number;
  transactionsCount: number;
  averageBasketSize: number;
  tvaCollected: number;
  discountsApplied: number;
  costOfGoodsSold: number;
  netProfit: number;
  netProfitMargin: number;
  momGrowthPercentage: number;
  paymentBreakdown: PaymentBreakdown;

  // Velocity & charts
  hourlySalesVelocity: HourlySalesMetric[];
  monthlyTrends: MonthlyTrendMetric[];
  yearlyComparison: {
    year: string;
    turnover: number;
    costValuation: number;
    retailValuation: number;
  }[];

  // Leaderboards
  topProducts: TopProductMetric[];
  topCategories: TopCategoryMetric[];
  employeePerformance: EmployeePerformanceMetric[];

  // Legacy compatibility
  todaySalesTotal: number;
  todayInvoicesCount: number;
  yoyValuationGrowth: number;
  yoySalesGrowth: number;
  yoyStockGrowth: number;
  categoryValuation: { name: string; cost: number; retail: number; count: number }[];
  recentDailySnapshots: DailyStockSnapshot[];
}
