import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Sale, CashSession, Notification, User, HeldCart } from '../types';
import { generateId, generateSaleId } from '../utils/helpers';

interface AppState {
  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  loginWithPin: (pin: string) => boolean;
  logout: () => void;

  // UI
  activeModule: string;
  darkMode: boolean;
  sidebarCollapsed: boolean;
  setActiveModule: (module: string) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Cart (POS)
  cart: CartItem[];
  discount: number;
  discountType: 'percent' | 'fixed';
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setDiscount: (value: number, type: 'percent' | 'fixed') => void;

  // Held Carts
  heldCarts: HeldCart[];
  holdCurrentCart: () => void;
  recallCart: (id: string) => void;
  deleteHeldCart: (id: string) => void;

  // Sales
  sales: Sale[];
  completeSale: (paymentMethods: { method: string; amount: number }[], cashGiven?: number) => Sale | null;

  // Cash Session
  cashSession: CashSession | null;
  cashSessionsHistory: CashSession[];
  openCashSession: (initialAmount: number) => void;
  closeCashSession: (actualAmount: number, expectedAmount: number, difference: number, notes?: string, denominations?: Record<string, number>) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const DEMO_USERS: User[] = [
  { id: '1', name: 'Carlos Mendoza', email: 'admin@nexuspos.com', role: 'admin', avatar: 'CM', branch: 'Tienda Principal', active: true },
  { id: '2', name: 'Laura García', email: 'cajera@nexuspos.com', role: 'cajero', avatar: 'LG', branch: 'Tienda Principal', active: true },
  { id: '3', name: 'Diego Herrera', email: 'gerente@nexuspos.com', role: 'gerente', avatar: 'DH', branch: 'Sucursal Norte', active: true },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Coca-Cola 350ml', sku: 'CC-350', barcode: '7702001000012', price: 2500, cost: 1600, stock: 48, minStock: 12, category: 'Bebidas', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Agua Cristal 600ml', sku: 'AC-600', barcode: '7702067000015', price: 1800, cost: 900, stock: 72, minStock: 24, category: 'Bebidas', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p3', name: 'Paquete Margarita 30g', sku: 'PM-30', barcode: '7702012000022', price: 1200, cost: 700, stock: 5, minStock: 10, category: 'Snacks', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p4', name: 'Aguardiente Antioqueño 375ml', sku: 'AA-375', barcode: '7702098000045', price: 25000, cost: 16000, stock: 18, minStock: 6, category: 'Licores', unit: 'und', taxRate: 0.19, active: true, createdAt: new Date().toISOString() },
  { id: 'p5', name: 'Ron Medellín Añejo 750ml', sku: 'RM-750', barcode: '7702076000033', price: 58000, cost: 38000, stock: 8, minStock: 4, category: 'Licores', unit: 'und', taxRate: 0.19, active: true, createdAt: new Date().toISOString() },
  { id: 'p6', name: 'Cigarrillos Marlboro', sku: 'CIG-MAR', barcode: '7702055000061', price: 12000, cost: 8000, stock: 22, minStock: 10, category: 'Cigarrillos', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p7', name: 'Chocolate Jet 28g', sku: 'CJ-28', barcode: '7702023000018', price: 1500, cost: 900, stock: 35, minStock: 15, category: 'Dulces', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p8', name: 'Leche Entera Alpina 1L', sku: 'LA-1L', barcode: '7702067000051', price: 4200, cost: 2800, stock: 24, minStock: 12, category: 'Lácteos', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p9', name: 'Pan Tajado Bimbo', sku: 'PB-01', barcode: '7702034000028', price: 6500, cost: 4200, stock: 10, minStock: 5, category: 'Panadería', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p10', name: 'Cerveza Club Colombia 330ml', sku: 'CC-CER', barcode: '7702011000037', price: 3800, cost: 2200, stock: 60, minStock: 24, category: 'Cervezas', unit: 'und', taxRate: 0.19, active: true, createdAt: new Date().toISOString() },
  { id: 'p11', name: 'Arroz Diana 500g', sku: 'AD-500', barcode: '7702045000014', price: 3200, cost: 2100, stock: 45, minStock: 20, category: 'Granos', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'p12', name: 'Aceite Vegetal 1L', sku: 'AV-1L', barcode: '7702056000020', price: 9800, cost: 6500, stock: 2, minStock: 8, category: 'Aceites', unit: 'und', taxRate: 0, active: true, createdAt: new Date().toISOString() },
];

// Generate historical sales data for reports
const generateHistoricalSales = (): Sale[] => {
  const sales: Sale[] = [];
  const now = new Date();
  let saleCounter = 1;

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const salesCount = Math.floor(Math.random() * 20) + 15;

    for (let s = 0; s < salesCount; s++) {
      const hour = Math.floor(Math.random() * 13) + 8;
      date.setHours(hour, Math.floor(Math.random() * 60));
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const items: CartItem[] = [];
      let subtotal = 0;
      let taxes = 0;

      for (let i = 0; i < itemCount; i++) {
        const prod = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const itemSubtotal = prod.price * qty;
        const itemTax = itemSubtotal * prod.taxRate;
        subtotal += itemSubtotal;
        taxes += itemTax;
        items.push({ product: prod, quantity: qty, discount: 0, subtotal: itemSubtotal });
      }

      const total = subtotal + taxes;
      sales.push({
        id: generateSaleId(saleCounter++),
        items,
        subtotal,
        discount: 0,
        taxes,
        total,
        payments: [{ method: 'Efectivo', amount: total }],
        cashier: 'Laura García',
        branch: 'Tienda Principal',
        status: 'completed',
        createdAt: date.toISOString(),
      });
    }
  }
  return sales;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  // Auth
  currentUser: null,
  isAuthenticated: false,
  login: (email, password) => {
    const user = DEMO_USERS.find(u => u.email === email);
    if (user && password === 'nexus2024') {
      const activeModule = user.role === 'cajero' ? 'pos' : 'dashboard';
      set({ currentUser: user, isAuthenticated: true, activeModule });
      get().addNotification({ type: 'success', title: 'Sesión iniciada', message: `Bienvenido, ${user.name}` });
      return true;
    }
    return false;
  },
  loginWithPin: (pin) => {
    const pinMap: Record<string, string> = {
      '1111': 'admin@nexuspos.com',
      '2222': 'cajera@nexuspos.com',
      '3333': 'gerente@nexuspos.com'
    };
    const email = pinMap[pin];
    if (email) {
      const user = DEMO_USERS.find(u => u.email === email);
      if (user) {
        const activeModule = user.role === 'cajero' ? 'pos' : 'dashboard';
        set({ currentUser: user, isAuthenticated: true, activeModule });
        get().addNotification({ type: 'success', title: 'Sesión iniciada', message: `Bienvenido, ${user.name}` });
        return true;
      }
    }
    return false;
  },
  logout: () => set({ currentUser: null, isAuthenticated: false, cashSession: null, cart: [], activeModule: 'dashboard' }),

  // UI
  activeModule: 'dashboard',
  darkMode: true,
  sidebarCollapsed: false,
  setActiveModule: (module) => set({ activeModule: module }),
  toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // Products
  products: INITIAL_PRODUCTS,
  addProduct: (product) => set(s => ({
    products: [...s.products, { ...product, id: generateId(), createdAt: new Date().toISOString() }]
  })),
  updateProduct: (id, updates) => set(s => ({
    products: s.products.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deleteProduct: (id) => set(s => ({ products: s.products.filter(p => p.id !== id) })),

  // Cart
  cart: [],
  discount: 0,
  discountType: 'percent',
  addToCart: (product) => set(s => {
    const existing = s.cart.find(i => i.product.id === product.id);
    if (existing) {
      return {
        cart: s.cart.map(i => i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.product.price * (1 - i.discount / 100) }
          : i)
      };
    }
    return { cart: [...s.cart, { product, quantity: 1, discount: 0, subtotal: product.price }] };
  }),
  removeFromCart: (productId) => set(s => ({ cart: s.cart.filter(i => i.product.id !== productId) })),
  updateCartQty: (productId, qty) => set(s => ({
    cart: qty <= 0
      ? s.cart.filter(i => i.product.id !== productId)
      : s.cart.map(i => i.product.id === productId
          ? { ...i, quantity: qty, subtotal: qty * i.product.price * (1 - i.discount / 100) }
          : i)
  })),
  clearCart: () => set({ cart: [], discount: 0, discountType: 'percent' }),
  setDiscount: (value, type) => set({ discount: value, discountType: type }),

  // Held Carts
  heldCarts: [],
  holdCurrentCart: () => {
    const { cart, discount, discountType, heldCarts } = get();
    if (cart.length === 0) return;
    const newHeld: HeldCart = {
      id: `ESP-${heldCarts.length + 1}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      cart: [...cart],
      discount,
      discountType,
      heldAt: new Date().toISOString()
    };
    set({
      heldCarts: [...heldCarts, newHeld],
      cart: [],
      discount: 0,
      discountType: 'percent'
    });
    get().addNotification({ type: 'info', title: '📥 Venta retenida', message: `Guardada en espera: ${newHeld.id}` });
  },
  recallCart: (id) => {
    const { heldCarts, cart } = get();
    const target = heldCarts.find(c => c.id === id);
    if (!target) return;
    let newHeldCarts = heldCarts.filter(c => c.id !== id);
    if (cart.length > 0) {
      const newHeld: HeldCart = {
        id: `ESP-${heldCarts.length}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        cart: [...cart],
        discount: get().discount,
        discountType: get().discountType,
        heldAt: new Date().toISOString()
      };
      newHeldCarts = [...newHeldCarts, newHeld];
    }
    set({
      cart: target.cart,
      discount: target.discount,
      discountType: target.discountType,
      heldCarts: newHeldCarts
    });
    get().addNotification({ type: 'success', title: '📤 Venta recuperada', message: `Cargada de espera: ${target.id}` });
  },
  deleteHeldCart: (id) => set(s => ({
    heldCarts: s.heldCarts.filter(c => c.id !== id)
  })),

  // Sales
  sales: generateHistoricalSales(),
  completeSale: (paymentMethods, _cashGiven) => {
    const { cart, discount, discountType, currentUser, cashSession } = get();
    if (cart.length === 0 || !cashSession) return null;

    const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
    const discountAmount = discountType === 'percent' ? subtotal * (discount / 100) : discount;
    const afterDiscount = subtotal - discountAmount;
    const taxes = cart.reduce((sum, i) => sum + (i.subtotal * i.product.taxRate), 0);
    const total = afterDiscount + taxes;

    const sale: Sale = {
      id: generateSaleId(get().sales.length + 1),
      items: [...cart],
      subtotal,
      discount: discountAmount,
      taxes,
      total,
      payments: paymentMethods,
      cashier: currentUser?.name || 'Cajero',
      branch: currentUser?.branch || 'Principal',
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    // Update stock
    const updatedProducts = get().products.map(p => {
      const cartItem = cart.find(i => i.product.id === p.id);
      if (cartItem) {
        const newStock = p.stock - cartItem.quantity;
        if (newStock <= p.minStock) {
          get().addNotification({
            type: 'warning',
            title: '⚠️ Stock bajo',
            message: `${p.name}: solo quedan ${newStock} unidades`,
          });
        }
        return { ...p, stock: Math.max(0, newStock) };
      }
      return p;
    });

    set(s => ({
      sales: [sale, ...s.sales],
      products: updatedProducts,
      cart: [],
      discount: 0,
    }));

    get().addNotification({ type: 'success', title: '✅ Venta completada', message: `$${total.toLocaleString('es-CO')} — ${sale.id}` });
    return sale;
  },

  // Cash Session
  cashSession: null,
  cashSessionsHistory: [],
  openCashSession: (initialAmount) => {
    const session: CashSession = {
      id: generateId(),
      openedAt: new Date().toISOString(),
      closedAt: null,
      initialAmount,
      finalAmount: null,
      cashier: get().currentUser?.name || 'Cajero',
      status: 'open',
    };
    set({ cashSession: session });
    get().addNotification({ type: 'info', title: '🟢 Caja abierta', message: `Monto inicial: $${initialAmount.toLocaleString('es-CO')}` });
  },
  closeCashSession: (actualAmount, expectedAmount, difference, notes = '', denominations = {}) => {
    const { cashSession } = get();
    if (!cashSession) return;
    
    const closedSession: CashSession = {
      ...cashSession,
      closedAt: new Date().toISOString(),
      finalAmount: actualAmount,
      expectedAmount,
      actualAmount,
      difference,
      notes,
      denominations,
      status: 'closed',
    };

    set(s => ({
      cashSession: closedSession,
      cashSessionsHistory: [closedSession, ...s.cashSessionsHistory]
    }));
    get().addNotification({ 
      type: 'info', 
      title: '🔴 Caja cerrada', 
      message: `Corte realizado. Diferencia: $${difference.toLocaleString('es-CO')}` 
    });
  },

  // Notifications
  notifications: [
    { id: 'n1', type: 'warning', title: '⚠️ Stock bajo', message: 'Paquete Margarita 30g: solo quedan 5 unidades', timestamp: new Date().toISOString(), read: false },
    { id: 'n2', type: 'warning', title: '⚠️ Stock crítico', message: 'Aceite Vegetal 1L: solo quedan 2 unidades', timestamp: new Date().toISOString(), read: false },
    { id: 'n3', type: 'info', title: '📊 Reporte listo', message: 'Resumen del día disponible', timestamp: new Date().toISOString(), read: false },
  ],
  addNotification: (n) => set(s => ({
    notifications: [
      { ...n, id: generateId(), timestamp: new Date().toISOString(), read: false },
      ...s.notifications,
    ].slice(0, 50)
  })),
  markNotificationRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  clearNotifications: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
    }),
    {
      name: 'nexuspos-store',
    }
  )
);
