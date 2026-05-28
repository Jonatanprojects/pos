// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';

describe('useStore - Core Logic Calculations', () => {
  beforeEach(() => {
    // Reset Zustand store to initial state before each test
    useStore.setState({
      cart: [],
      discount: 0,
      discountType: 'percent',
      cashSession: null,
      cashSessionsHistory: [],
      products: [
        { id: 't1', name: 'Product Tax Free', sku: 'P-TF', barcode: '1', price: 10000, cost: 6000, stock: 10, minStock: 2, category: 'Otros', unit: 'und', taxRate: 0, active: true, createdAt: '' },
        { id: 't2', name: 'Product Tax 19%', sku: 'P-T19', barcode: '2', price: 20000, cost: 12000, stock: 5, minStock: 1, category: 'Otros', unit: 'und', taxRate: 0.19, active: true, createdAt: '' }
      ]
    });
  });

  it('should add products to cart and compute item subtotals', () => {
    const { addToCart } = useStore.getState();
    const product = useStore.getState().products[0];
    
    addToCart(product);
    
    let state = useStore.getState();
    expect(state.cart.length).toBe(1);
    expect(state.cart[0].product.id).toBe('t1');
    expect(state.cart[0].quantity).toBe(1);
    expect(state.cart[0].subtotal).toBe(10000);

    addToCart(product);
    state = useStore.getState();
    expect(state.cart[0].quantity).toBe(2);
    expect(state.cart[0].subtotal).toBe(20000);
  });

  it('should correctly calculate percentages discount', () => {
    const { addToCart, setDiscount, completeSale, openCashSession } = useStore.getState();
    const p1 = useStore.getState().products[0]; // $10,000, 0% tax
    
    openCashSession(100000);
    addToCart(p1);
    setDiscount(10, 'percent'); // 10% discount

    // Complete sale to inspect calculated amounts
    const sale = completeSale([{ method: 'Efectivo', amount: 9000 }]);
    expect(sale).not.toBeNull();
    expect(sale?.subtotal).toBe(10000);
    expect(sale?.discount).toBe(1000); // 10% of 10000
    expect(sale?.taxes).toBe(0);
    expect(sale?.total).toBe(9000);
  });

  it('should correctly calculate fixed value discount', () => {
    const { addToCart, setDiscount, completeSale, openCashSession } = useStore.getState();
    const p1 = useStore.getState().products[0]; // $10,000, 0% tax
    
    openCashSession(100000);
    addToCart(p1);
    setDiscount(2500, 'fixed'); // $2,500 discount

    const sale = completeSale([{ method: 'Efectivo', amount: 7500 }]);
    expect(sale).not.toBeNull();
    expect(sale?.subtotal).toBe(10000);
    expect(sale?.discount).toBe(2500);
    expect(sale?.total).toBe(7500);
  });

  it('should compute tax rates correctly', () => {
    const { addToCart, completeSale, openCashSession } = useStore.getState();
    const p2 = useStore.getState().products[1]; // $20,000, 19% tax
    
    openCashSession(100000);
    addToCart(p2); // Subtotal: 20000

    const sale = completeSale([{ method: 'Efectivo', amount: 23800 }]);
    expect(sale).not.toBeNull();
    expect(sale?.subtotal).toBe(20000);
    expect(sale?.taxes).toBe(3800); // 19% of 20000
    expect(sale?.total).toBe(23800); // 20000 + 3800
  });

  it('should manage cash session audits and reconciliation differences', () => {
    const { openCashSession, closeCashSession } = useStore.getState();
    
    // Open cash with 150k
    openCashSession(150000);
    let state = useStore.getState();
    expect(state.cashSession?.initialAmount).toBe(150000);
    expect(state.cashSession?.status).toBe('open');

    // Close session with actual 148k when expected was 150k (Faltante of -2k)
    closeCashSession(148000, 150000, -2000, 'Faltante de caja', { '50000': 2, '20000': 2, '5000': 1, '2000': 1, '1000': 1 });
    
    state = useStore.getState();
    expect(state.cashSession?.status).toBe('closed');
    expect(state.cashSession?.finalAmount).toBe(148000);
    expect(state.cashSession?.difference).toBe(-2000);
    expect(state.cashSessionsHistory.length).toBe(1);
    expect(state.cashSessionsHistory[0].difference).toBe(-2000);
    expect(state.cashSessionsHistory[0].notes).toBe('Faltante de caja');
  });
});
