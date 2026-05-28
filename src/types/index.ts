export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'gerente' | 'supervisor' | 'cajero';
  avatar: string;
  branch: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: string;
  unit: string;
  taxRate: number;
  active: boolean;
  createdAt: string;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface PaymentMethod {
  method: string;
  amount: number;
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  taxes: number;
  total: number;
  payments: PaymentMethod[];
  cashier: string;
  branch: string;
  status: 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  note?: string;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  finalAmount: number | null;
  cashier: string;
  status: 'open' | 'closed';
  expectedAmount?: number;
  actualAmount?: number;
  difference?: number;
  notes?: string;
  denominations?: Record<string, number>;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'return';
  quantity: number;
  reference: string;
  user: string;
  timestamp: string;
  note?: string;
}

export interface HeldCart {
  id: string;
  cart: CartItem[];
  discount: number;
  discountType: 'percent' | 'fixed';
  heldAt: string;
}

export type ModuleId =
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'sales'
  | 'reports'
  | 'cash'
  | 'customers'
  | 'settings';
