import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X, CheckCircle, ReceiptText, ShoppingBag, Percent, Hash, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../utils/helpers';
import { Product } from '../types';
import { useBarcodeScanner } from '../utils/useBarcodeScanner';

const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: Banknote, color: 'emerald' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'blue' },
  { id: 'Transferencia', label: 'Transferencia', icon: Smartphone, color: 'violet' },
  { id: 'Nequi', label: 'Nequi', icon: Smartphone, color: 'pink' },
];

export default function POS() {
  const { products, cart, addToCart, removeFromCart, updateCartQty, clearCart, completeSale,
    cashSession, openCashSession, discount, discountType, setDiscount, darkMode,
    heldCarts, holdCurrentCart, recallCart, deleteHeldCart } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showPayment, setShowPayment] = useState(false);
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [lastSale, setLastSale] = useState<{ sale: any; change: number } | null>(null);
  const [initialCash, setInitialCash] = useState('');
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({ Efectivo: '' });
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['Efectivo']);
  const [cashGiven, setCashGiven] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleBarcodeScan = (code: string) => {
    const found = products.find(p => p.barcode === code || p.sku === code);
    if (found) {
      handleProductClick(found);
    }
  };

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: !showPayment && !showOpenCash && !showSuccess && !showHeldModal
  });

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    if (!p.active) return false;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
    const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const subtotal = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const discountAmount = discountType === 'percent' ? subtotal * (discount / 100) : Math.min(discount, subtotal);
  const afterDiscount = subtotal - discountAmount;
  const taxes = cart.reduce((sum, i) => sum + i.subtotal * i.product.taxRate, 0);
  const total = afterDiscount + taxes;

  const totalPaid = selectedMethods.reduce((sum, m) => sum + (parseFloat(paymentInputs[m] || '0') || 0), 0);
  const change = totalPaid - total;

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!gridContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const cols = containerWidth < 640 ? 2 : containerWidth < 1280 ? 3 : 4;

  const rows: Product[][] = [];
  for (let i = 0; i < filtered.length; i += cols) {
    rows.push(filtered.slice(i, i + cols));
  }

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => gridContainerRef.current,
    estimateSize: () => 140,
    overscan: 4,
  });

  const handleProductClick = (product: Product) => {
    if (!cashSession) { setShowOpenCash(true); return; }
    if (product.stock <= 0) return;
    addToCart(product);
  };

  const handleCompleteSale = () => {
    const payments = selectedMethods
      .map(m => ({ method: m, amount: parseFloat(paymentInputs[m] || '0') || 0 }))
      .filter(p => p.amount > 0);
    if (payments.length === 0 || totalPaid < total) return;
    const sale = completeSale(payments, parseFloat(cashGiven || '0'));
    if (sale) {
      setLastSale({ sale, change: change });
      setShowPayment(false);
      setShowSuccess(true);
      setPaymentInputs({ Efectivo: '' });
      setSelectedMethods(['Efectivo']);
      setCashGiven('');
    }
  };

  const handlePrintReceipt = (sale: any, changeAmount: number) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = sale.items.map((i: any) => `
      <div class="row">
        <span>${i.product.name} x${i.quantity}</span>
        <span>${formatCurrency(i.subtotal)}</span>
      </div>
      ${i.discount > 0 ? `<div class="row text-xs italic" style="color:#666;"><span>  Desc ${i.discount}%</span></div>` : ''}
    `).join('');

    const paymentsHtml = sale.payments.map((p: any) => `
      <div class="row">
        <span>Pago (${p.method}):</span>
        <span>${formatCurrency(p.amount)}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - ${sale.id}</title>
          <style>
            @media print {
              body { width: 80mm; margin: 0; padding: 5mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; }
            }
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            .text-xs { font-size: 10px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2 class="center" style="margin:0 0 5px 0;">NEXUS POS</h2>
          <p class="center" style="margin:0;">Nit: 123.456.789-0</p>
          <p class="center" style="margin:0;">Tel: (604) 555-0123</p>
          <p class="center" style="margin:0;">Sucursal: ${sale.branch}</p>
          <div class="divider"></div>
          <div class="row"><span class="bold">Factura:</span><span>${sale.id}</span></div>
          <div class="row"><span class="bold">Cajero:</span><span>${sale.cashier}</span></div>
          <div class="row"><span>Fecha:</span><span>${new Date(sale.createdAt).toLocaleString('es-CO')}</span></div>
          <div class="divider"></div>
          
          <p class="bold" style="margin:5px 0;">PRODUCTOS</p>
          ${itemsHtml}
          
          <div class="divider"></div>
          <div class="row"><span>Subtotal:</span><span>${formatCurrency(sale.subtotal)}</span></div>
          ${sale.discount > 0 ? `<div class="row"><span>Descuento:</span><span>-${formatCurrency(sale.discount)}</span></div>` : ''}
          ${sale.taxes > 0 ? `<div class="row"><span>Impuestos:</span><span>${formatCurrency(sale.taxes)}</span></div>` : ''}
          <div class="row"><span class="bold">TOTAL:</span><span class="bold">${formatCurrency(sale.total)}</span></div>
          
          <div class="divider"></div>
          <p class="bold" style="margin:5px 0;">INFORMACION DE PAGO</p>
          ${paymentsHtml}
          ${changeAmount > 0 ? `<div class="row"><span class="bold">Cambio:</span><span>${formatCurrency(changeAmount)}</span></div>` : ''}
          
          <div class="divider"></div>
          <p class="center bold" style="margin-top:20px;">¡Gracias por su compra!</p>
          <p class="center text-xs" style="margin:0;">Autorizado por la DIAN</p>
          <p class="center text-xs" style="margin:0;">NexusPOS v2.0</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenCash = () => {
    const amount = parseFloat(initialCash.replace(/\D/g, '')) || 0;
    openCashSession(amount);
    setShowOpenCash(false);
    setInitialCash('');
  };

  const togglePaymentMethod = (method: string) => {
    setSelectedMethods(prev => {
      const isSelected = prev.includes(method);
      const nextMethods = isSelected ? prev.filter(m => m !== method) : [...prev, method];
      
      if (!isSelected) {
        const currentPaidOthers = prev.reduce((sum, m) => sum + (parseFloat(paymentInputs[m] || '0') || 0), 0);
        const remaining = Math.max(0, total - currentPaidOthers);
        setPaymentInputs(p => ({ ...p, [method]: String(remaining) }));
      } else {
        setPaymentInputs(p => {
          const next = { ...p };
          delete next[method];
          if (nextMethods.length === 1) {
            next[nextMethods[0]] = String(total);
          }
          return next;
        });
      }
      return nextMethods;
    });
  };

  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode
    ? 'bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500';

  return (
    <div className="flex-1 overflow-hidden flex gap-4 p-4 h-full">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 space-y-3">
        {/* Session warning */}
        {!cashSession && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300 flex-1">Debes abrir la caja antes de vender</p>
            <button onClick={() => setShowOpenCash(true)} className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
              Abrir caja
            </button>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar producto, código o barcode..."
              className={cn('w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-violet-500/50', inputClass)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {heldCarts.length > 0 && (
            <button
              onClick={() => setShowHeldModal(true)}
              className="bg-amber-600/20 border border-amber-500/30 hover:bg-amber-600/30 text-amber-400 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              ⏳ En Espera
              <span className="bg-amber-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold text-[10px]">
                {heldCarts.length}
              </span>
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150',
                selectedCategory === cat
                  ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                  : darkMode ? 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div ref={gridContainerRef} className="flex-1 overflow-y-auto min-h-0">
          {filtered.length > 0 ? (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const rowProducts = rows[virtualRow.index] || [];
                return (
                  <div
                    key={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gap: '12px',
                      paddingBottom: '12px',
                    }}
                  >
                    {rowProducts.map((product) => {
                      const inCart = cart.find((i) => i.product.id === product.id);
                      const outOfStock = product.stock <= 0;
                      return (
                        <button
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          disabled={outOfStock}
                          className={cn(
                            'rounded-xl border p-3 text-left transition-all duration-150 group relative flex flex-col justify-between h-[128px]',
                            outOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]',
                            inCart ? 'border-violet-500/60 bg-violet-600/10' : card
                          )}
                        >
                          {inCart && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {inCart.quantity}
                            </div>
                          )}
                          <div className="flex gap-2 items-start">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0', darkMode ? 'bg-gray-800' : 'bg-gray-100')}>
                              {product.category === 'Bebidas' ? '🥤' :
                                product.category === 'Licores' ? '🥃' :
                                product.category === 'Cervezas' ? '🍺' :
                                product.category === 'Snacks' ? '🍟' :
                                product.category === 'Dulces' ? '🍫' :
                                product.category === 'Lácteos' ? '🥛' :
                                product.category === 'Panadería' ? '🍞' :
                                product.category === 'Granos' ? '🌾' :
                                product.category === 'Aceites' ? '🫙' :
                                product.category === 'Cigarrillos' ? '🚬' : '📦'}
                            </div>
                            <div className="min-w-0">
                              <p className={cn('text-xs font-semibold leading-tight', textPrimary, 'line-clamp-2')}>{product.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{product.sku}</p>
                            </div>
                          </div>
                          <div className="flex items-end justify-between mt-auto">
                            <p className="text-xs font-bold text-violet-400">{formatCurrency(product.price)}</p>
                            <span className={cn('text-[10px]', product.stock <= product.minStock ? 'text-amber-400' : 'text-gray-500')}>
                              {outOfStock ? 'Agotado' : `${product.stock} u`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className={cn('w-12 h-12 mx-auto mb-3', textSecondary)} />
              <p className={textSecondary}>No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className={cn('w-80 flex flex-col rounded-2xl border', card)}>
        {/* Cart Header */}
        <div className={cn('p-4 border-b', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-violet-400" />
              <span className={cn('font-semibold text-sm', textPrimary)}>Carrito</span>
              {cart.length > 0 && (
                <span className="bg-violet-600/20 text-violet-400 text-xs px-1.5 py-0.5 rounded-full font-medium">{cart.length}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <>
                  <button
                    onClick={holdCurrentCart}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 mr-1"
                    title="Poner en espera"
                  >
                    ⏸️ Espera
                  </button>
                  <button onClick={clearCart} className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
                    <X className="w-3 h-3" /> Limpiar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className={cn('w-10 h-10 mx-auto mb-2', textSecondary)} />
              <p className={cn('text-sm', textSecondary)}>Carrito vacío</p>
              <p className="text-xs text-gray-500 mt-1">Selecciona productos para agregar</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className={cn('rounded-xl p-3', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                <div className="flex items-start justify-between mb-2">
                  <p className={cn('text-xs font-medium flex-1 mr-2', textPrimary, 'leading-tight')}>{item.product.name}</p>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)} className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors text-xs font-bold', darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className={cn('text-sm font-bold w-6 text-center', textPrimary)}>{item.quantity}</span>
                    <button onClick={() => updateCartQty(item.product.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock} className={cn('w-6 h-6 rounded-lg flex items-center justify-center transition-colors text-xs font-bold disabled:opacity-40', darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')}>
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-violet-400">{formatCurrency(item.subtotal)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount */}
        {cart.length > 0 && (
          <div className={cn('px-4 py-3 border-t', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
            <div className="flex gap-2">
              <div className="flex rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                <button
                  onClick={() => setDiscount(discount, 'percent')}
                  className={cn('px-2 py-1.5 text-xs transition-colors', discountType === 'percent' ? 'bg-violet-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100')}
                >
                  <Percent className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setDiscount(discount, 'fixed')}
                  className={cn('px-2 py-1.5 text-xs transition-colors', discountType === 'fixed' ? 'bg-violet-600 text-white' : darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100')}
                >
                  <Hash className="w-3 h-3" />
                </button>
              </div>
              <input
                type="number"
                value={discount || ''}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0, discountType)}
                placeholder={discountType === 'percent' ? 'Descuento %' : 'Descuento $'}
                className={cn('flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors focus:outline-none', inputClass)}
              />
            </div>
          </div>
        )}

        {/* Totals */}
        {cart.length > 0 && (
          <div className={cn('px-4 py-3 border-t space-y-1.5', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
            <div className="flex justify-between text-xs">
              <span className={textSecondary}>Subtotal</span>
              <span className={textPrimary}>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">Descuento</span>
                <span className="text-emerald-400">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxes > 0 && (
              <div className="flex justify-between text-xs">
                <span className={textSecondary}>IVA/Impuestos</span>
                <span className={textPrimary}>{formatCurrency(taxes)}</span>
              </div>
            )}
            <div className={cn('flex justify-between pt-1.5 border-t', darkMode ? 'border-gray-700' : 'border-gray-200')}>
              <span className={cn('text-sm font-bold', textPrimary)}>TOTAL</span>
              <span className="text-lg font-bold text-violet-400">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <div className="p-4">
          <button
            onClick={() => {
              if (cart.length > 0) {
                setPaymentInputs({ Efectivo: String(total) });
                setSelectedMethods(['Efectivo']);
                setShowPayment(true);
              }
            }}
            disabled={cart.length === 0}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl py-3.5 transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <ReceiptText className="w-4 h-4" />
            Cobrar {cart.length > 0 && formatCurrency(total)}
          </button>
        </div>
      </div>

      {/* Open Cash Modal */}
      {showOpenCash && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn('rounded-2xl border p-6 w-full max-w-sm shadow-2xl', card)}>
            <h3 className={cn('text-lg font-bold mb-1', textPrimary)}>Abrir caja</h3>
            <p className={cn('text-sm mb-4', textSecondary)}>Ingresa el monto inicial en efectivo</p>
            <input
              type="number"
              value={initialCash}
              onChange={e => setInitialCash(e.target.value)}
              placeholder="$ 0"
              autoFocus
              className={cn('w-full px-4 py-3 rounded-xl border text-lg font-bold text-center focus:outline-none focus:ring-1 focus:ring-violet-500/50 mb-4', inputClass)}
            />
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[50000, 100000, 200000].map(amt => (
                <button key={amt} onClick={() => setInitialCash(String(amt))} className={cn('text-xs py-2 rounded-lg border transition-colors', darkMode ? 'border-gray-700 text-gray-400 hover:border-violet-500 hover:text-violet-400' : 'border-gray-300 text-gray-600 hover:border-violet-400 hover:text-violet-600')}>
                  ${(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowOpenCash(false)} className={cn('flex-1 py-2.5 rounded-xl border text-sm transition-colors', darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}>
                Cancelar
              </button>
              <button onClick={handleOpenCash} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                Abrir caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn('rounded-2xl border p-6 w-full max-w-md shadow-2xl', card)}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn('text-lg font-bold', textPrimary)}>Método de pago</h3>
              <button onClick={() => setShowPayment(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={cn('rounded-xl p-4 mb-5 text-center', darkMode ? 'bg-gray-800/60' : 'bg-gray-50')}>
              <p className={cn('text-sm', textSecondary)}>Total a cobrar</p>
              <p className="text-3xl font-bold text-violet-400 mt-1">{formatCurrency(total)}</p>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PAYMENT_METHODS.map(pm => {
                const Icon = pm.icon;
                const selected = selectedMethods.includes(pm.id);
                return (
                  <button
                    key={pm.id}
                    onClick={() => togglePaymentMethod(pm.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all',
                      selected ? 'border-violet-500/60 bg-violet-600/10 text-violet-300' : darkMode ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {pm.label}
                  </button>
                );
              })}
            </div>

            {/* Amount inputs */}
            <div className="space-y-3 mb-4">
              {selectedMethods.map(method => (
                <div key={method}>
                  <label className={cn('block text-xs font-medium mb-1', textSecondary)}>{method}</label>
                  <input
                    type="number"
                    value={paymentInputs[method] || ''}
                    onChange={e => setPaymentInputs(prev => ({ ...prev, [method]: e.target.value }))}
                    placeholder={method === 'Efectivo' ? `${formatCurrency(total)} (mínimo)` : `$ Monto`}
                    className={cn('w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50', inputClass)}
                  />
                  {method === 'Efectivo' && parseFloat(paymentInputs['Efectivo'] || '0') > total && (
                    <p className="text-xs text-emerald-400 mt-1">
                      Cambio: {formatCurrency(parseFloat(paymentInputs['Efectivo'] || '0') - total)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Quick amounts for cash */}
            {selectedMethods.includes('Efectivo') && (
              <div className="flex gap-2 mb-4">
                {[total, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4).map(amt => (
                  <button key={amt} onClick={() => setPaymentInputs(prev => ({ ...prev, Efectivo: String(amt) }))} className={cn('flex-1 text-xs py-1.5 rounded-lg border transition-colors', darkMode ? 'border-gray-700 text-gray-400 hover:border-violet-500 hover:text-violet-400' : 'border-gray-300 text-gray-600 hover:border-violet-400')}>
                    ${(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            )}

            {/* Progress */}
            {selectedMethods.length > 1 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className={textSecondary}>Pagado</span>
                  <span className={totalPaid >= total ? 'text-emerald-400' : 'text-amber-400'}>{formatCurrency(totalPaid)} / {formatCurrency(total)}</span>
                </div>
                <div className={cn('h-2 rounded-full', darkMode ? 'bg-gray-800' : 'bg-gray-100')}>
                  <div className={cn('h-full rounded-full transition-all', totalPaid >= total ? 'bg-emerald-500' : 'bg-violet-500')} style={{ width: `${Math.min(100, (totalPaid / total) * 100)}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowPayment(false)} className={cn('flex-1 py-3 rounded-xl border text-sm font-medium transition-colors', darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}>
                Cancelar
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={totalPaid < total}
                className="flex-2 flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold rounded-xl py-3 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Completar venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && lastSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn('rounded-2xl border p-8 w-full max-w-sm shadow-2xl text-center', card)}>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className={cn('text-xl font-bold mb-1', textPrimary)}>¡Venta completada!</h3>
            <p className="text-xs font-mono text-violet-400 mb-3">{lastSale.sale.id}</p>
            <p className="text-3xl font-bold text-violet-400 mb-2">{formatCurrency(lastSale.sale.total)}</p>
            {lastSale.change > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">
                <p className="text-sm text-emerald-400">Cambio a entregar</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(lastSale.change)}</p>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handlePrintReceipt(lastSale.sale, lastSale.change)}
                className={cn('flex-1 py-2.5 rounded-xl border text-sm transition-colors', darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
              >
                🖨️ Imprimir
              </button>
              <button onClick={() => setShowSuccess(false)} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Carts Modal */}
      {showHeldModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn('rounded-2xl border p-6 w-full max-w-md shadow-2xl', card)}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn('text-lg font-bold flex items-center gap-2', textPrimary)}>
                ⏳ Ventas en Espera
              </h3>
              <button onClick={() => setShowHeldModal(false)} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {heldCarts.map(hc => {
                const hcSub = hc.cart.reduce((sum, i) => sum + i.subtotal, 0);
                const hcDisc = hc.discountType === 'percent' ? hcSub * (hc.discount / 100) : hc.discount;
                const hcTotal = hcSub - hcDisc + hc.cart.reduce((sum, i) => sum + i.subtotal * i.product.taxRate, 0);
                return (
                  <div key={hc.id} className={cn('p-4 rounded-xl border flex flex-col justify-between', darkMode ? 'bg-gray-800/40 border-gray-700/60' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={cn('font-bold text-xs font-mono', textPrimary)}>{hc.id}</p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(hc.heldAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-violet-400">{formatCurrency(hcTotal)}</p>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-1 mb-3">
                      {hc.cart.map(i => `${i.product.name} (${i.quantity})`).join(', ')}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          deleteHeldCart(hc.id);
                          if (heldCarts.length <= 1) setShowHeldModal(false);
                        }}
                        className="flex-1 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => {
                          recallCart(hc.id);
                          setShowHeldModal(false);
                        }}
                        className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        Recuperar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
