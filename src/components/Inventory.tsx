import { useState, useRef, useCallback } from 'react';
import { Search, Plus, Edit3, Trash2, AlertTriangle, X, Package, TrendingUp,
  TrendingDown, Upload, BarChart2, History, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../utils/helpers';
import { Product } from '../types';
import { useBarcodeScanner } from '../utils/useBarcodeScanner';

const CATEGORIES = ['Bebidas', 'Licores', 'Cervezas', 'Snacks', 'Dulces',
  'Lácteos', 'Panadería', 'Granos', 'Aceites', 'Cigarrillos', 'Otros'];

const emptyProduct = (): Omit<Product, 'id' | 'createdAt'> => ({
  name: '', sku: '', barcode: '', price: 0, cost: 0, stock: 0,
  minStock: 5, category: 'Bebidas', unit: 'und', taxRate: 0, active: true,
});

interface CsvError { row: number; field: string; message: string; }
interface CsvResult { imported: number; errors: CsvError[]; }

function parseCsv(text: string): { rows: Record<string, string>[]; headers: string[] } {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { rows: [], headers: [] };
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()]));
  });
  return { rows, headers };
}

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, darkMode, addNotification } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [stockFilter, setStockFilter] = useState('Todos');
  const [activeTab, setActiveTab] = useState<'list' | 'kardex' | 'csv'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<CsvResult | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [kardexProduct, setKardexProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode
    ? 'bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500';

  const categories = ['Todos', ...CATEGORIES];

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
    const matchCat = category === 'Todos' || p.category === category;
    const matchStock = stockFilter === 'Todos' ||
      (stockFilter === 'Bajo' && p.stock <= p.minStock && p.stock > 0) ||
      (stockFilter === 'Agotado' && p.stock === 0) ||
      (stockFilter === 'OK' && p.stock > p.minStock);
    return matchSearch && matchCat && matchStock;
  });

  const stats = {
    total: products.filter(p => p.active).length,
    lowStock: products.filter(p => p.stock <= p.minStock && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    inventoryValue: products.reduce((sum, p) => sum + p.cost * p.stock, 0),
  };

  // Barcode scanner: focus the search input and fill it
  const handleBarcodeScan = useCallback((code: string) => {
    setActiveTab('list');
    setSearch(code);
    const found = products.find(p => p.barcode === code || p.sku === code);
    if (found) {
      addNotification({ type: 'info', title: '🔍 Producto encontrado', message: found.name });
    } else {
      // Pre-fill the form with the scanned barcode for fast product creation
      setForm(prev => ({ ...prev, barcode: code }));
      setEditingProduct(null);
      setShowForm(true);
    }
  }, [products, addNotification]);

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: !showForm });

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyProduct());
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, sku: p.sku, barcode: p.barcode, price: p.price,
      cost: p.cost, stock: p.stock, minStock: p.minStock, category: p.category,
      unit: p.unit, taxRate: p.taxRate, active: p.active });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || form.price <= 0) return;
    if (editingProduct) {
      updateProduct(editingProduct.id, form);
      addNotification({ type: 'success', title: '✅ Producto actualizado', message: form.name });
    } else {
      addProduct(form);
      addNotification({ type: 'success', title: '✅ Producto agregado', message: form.name });
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    setConfirmDelete(null);
  };

  const margin = (p: Product) => p.price > 0 ? ((p.price - p.cost) / p.price * 100) : 0;

  // ─── CSV Import ──────────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const header = 'name,sku,barcode,price,cost,stock,min_stock,category,tax_rate';
    const example = 'Coca-Cola 350ml,CC-350,7702001000012,2500,1600,48,12,Bebidas,0';
    const blob = new Blob([header + '\n' + example], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nexuspos_plantilla_inventario.csv';
    a.click();
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    setCsvResult(null);

    const text = await file.text();
    const { rows } = parseCsv(text);

    let imported = 0;
    const errors: CsvError[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      if (!row.name) { errors.push({ row: rowNum, field: 'name', message: 'El nombre es requerido' }); return; }
      const price = parseFloat(row.price);
      if (isNaN(price) || price <= 0) { errors.push({ row: rowNum, field: 'price', message: 'Precio inválido' }); return; }

      const product: Omit<Product, 'id' | 'createdAt'> = {
        name: row.name,
        sku: row.sku || '',
        barcode: row.barcode || '',
        price,
        cost: parseFloat(row.cost) || 0,
        stock: parseInt(row.stock) || 0,
        minStock: parseInt(row.min_stock) || 5,
        category: CATEGORIES.includes(row.category) ? row.category : 'Otros',
        unit: row.unit || 'und',
        taxRate: parseFloat(row.tax_rate) || 0,
        active: true,
      };
      addProduct(product);
      imported++;
    });

    setCsvResult({ imported, errors });
    setCsvLoading(false);
    if (imported > 0) {
      addNotification({
        type: 'success',
        title: '📦 Carga masiva completada',
        message: `${imported} productos importados${errors.length > 0 ? `, ${errors.length} con errores` : ''}`
      });
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    e.target.value = '';
  };

  // Simulated Kardex based on sales for this product
  const getKardexForProduct = (productId: string) => {
    const sales = useStore.getState().sales;
    const events: { date: string; type: string; qty: number; ref: string; balance: number }[] = [];
    let balance = products.find(p => p.id === productId)?.stock || 0;

    // Rebuild from current stock + sales (reverse)
    const productSales = sales
      .filter(s => s.items.some(i => i.product.id === productId))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    let runningStock = balance;
    // estimate initial stock
    productSales.forEach(sale => {
      const item = sale.items.find(i => i.product.id === productId);
      if (!item) return;
      runningStock += item.quantity; // reverse
    });

    let simStock = runningStock;
    events.push({ date: new Date(Date.now() - 30 * 86400000).toISOString(), type: 'entrada', qty: simStock, ref: 'Stock inicial', balance: simStock });
    productSales.forEach(sale => {
      const item = sale.items.find(i => i.product.id === productId);
      if (!item) return;
      simStock -= item.quantity;
      events.push({ date: sale.createdAt, type: 'venta', qty: item.quantity, ref: sale.id, balance: simStock });
    });

    return events.slice(-20); // last 20 movements
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total productos', value: stats.total, icon: Package, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Stock bajo', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Agotados', value: stats.outOfStock, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Valor inventario', value: formatCurrency(stats.inventoryValue), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl border p-4 flex items-center gap-4', card)}>
            <div className={cn('p-2.5 rounded-xl', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <p className={cn('text-xs', textSecondary)}>{s.label}</p>
              <p className={cn('text-lg font-bold', textPrimary)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800/40 pb-0">
        {[
          { id: 'list', label: '📦 Inventario', icon: BarChart2 },
          { id: 'csv', label: '⬆️ Carga Masiva CSV', icon: Upload },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'list' | 'csv')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-t-xl border border-b-0 transition-all',
              activeTab === tab.id
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : darkMode ? 'border-gray-800 text-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: LIST ──────────────────────────────────────────────────────── */}
      {activeTab === 'list' && (
        <>
          {/* Controls */}
          <div className={cn('rounded-2xl border p-4', card)}>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, SKU, código de barras..."
                  className={cn('w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50', inputClass)}
                />
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)} className={cn('px-3 py-2 rounded-xl border text-sm focus:outline-none', inputClass)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className={cn('px-3 py-2 rounded-xl border text-sm focus:outline-none', inputClass)}>
                {['Todos', 'OK', 'Bajo', 'Agotado'].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-violet-500/25"
              >
                <Plus className="w-4 h-4" /> Agregar producto
              </button>
            </div>
          </div>

          {/* Table */}
          <div className={cn('rounded-2xl border overflow-hidden', card)}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn('border-b text-xs font-medium', darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500')}>
                    <th className="text-left px-4 py-3">Producto</th>
                    <th className="text-left px-4 py-3">Categoría</th>
                    <th className="text-right px-4 py-3">Costo</th>
                    <th className="text-right px-4 py-3">Precio</th>
                    <th className="text-right px-4 py-3">Margen</th>
                    <th className="text-center px-4 py-3">Stock</th>
                    <th className="text-center px-4 py-3">Estado</th>
                    <th className="text-center px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', darkMode ? 'divide-gray-800/40' : 'divide-gray-100')}>
                  {filtered.map(p => {
                    const m = margin(p);
                    const stockStatus = p.stock === 0 ? 'out' : p.stock <= p.minStock ? 'low' : 'ok';
                    return (
                      <tr key={p.id} className={cn('transition-colors', darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50')}>
                        <td className="px-4 py-3">
                          <div>
                            <p className={cn('text-sm font-medium', textPrimary)}>{p.name}</p>
                            <p className="text-xs text-gray-500">{p.sku} · {p.barcode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-2 py-1 rounded-lg', darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600')}>{p.category}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn('text-sm', textSecondary)}>{formatCurrency(p.cost)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn('text-sm font-semibold', textPrimary)}>{formatCurrency(p.price)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn('text-sm font-medium', m >= 30 ? 'text-emerald-400' : m >= 15 ? 'text-amber-400' : 'text-red-400')}>
                            {m.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={cn('text-sm font-bold', stockStatus === 'out' ? 'text-red-400' : stockStatus === 'low' ? 'text-amber-400' : textPrimary)}>{p.stock}</span>
                            <span className="text-xs text-gray-500">/{p.minStock}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                            stockStatus === 'out' ? 'bg-red-500/10 text-red-400' :
                            stockStatus === 'low' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-emerald-500/10 text-emerald-400'
                          )}>
                            {stockStatus === 'out' ? 'Agotado' : stockStatus === 'low' ? 'Stock bajo' : 'OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setKardexProduct(p)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                              title="Ver Kardex"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <Package className={cn('w-12 h-12 mx-auto mb-3', textSecondary)} />
                  <p className={textSecondary}>No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── TAB: CSV ───────────────────────────────────────────────────────── */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          {/* Instructions */}
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-bold text-lg mb-2', textPrimary)}>Carga Masiva de Inventario desde CSV</h3>
            <p className={cn('text-sm mb-4', textSecondary)}>
              Importa cientos de productos en segundos. Descarga la plantilla oficial, llena los datos y carga el archivo.
            </p>
            <div className={cn('p-4 rounded-xl text-xs font-mono mb-4', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              <p className="text-violet-400 mb-1">Columnas requeridas del CSV:</p>
              <p className={textSecondary}>name, sku, barcode, price, cost, stock, min_stock, category, tax_rate</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla CSV
              </button>
              <label className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-violet-500/25">
                <Upload className="w-4 h-4" />
                {csvLoading ? 'Procesando...' : 'Seleccionar archivo CSV'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvImport}
                  className="hidden"
                  disabled={csvLoading}
                />
              </label>
            </div>
          </div>

          {/* Results */}
          {csvResult && (
            <div className={cn('rounded-2xl border p-6', card)}>
              <h4 className={cn('font-bold mb-4', textPrimary)}>Resultado de la importación</h4>
              {csvResult.imported > 0 && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-emerald-400">{csvResult.imported} productos importados correctamente</p>
                    <p className="text-xs text-gray-500">Ya están disponibles en el inventario y en el POS</p>
                  </div>
                </div>
              )}
              {csvResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-red-400">⚠️ {csvResult.errors.length} filas con errores:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {csvResult.errors.map((err, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                        <span className="text-red-400 font-mono">Fila {err.row}</span>
                        <span className="text-gray-500">Campo: <strong>{err.field}</strong></span>
                        <span className="text-red-400">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── KARDEX MODAL ────────────────────────────────────────────────────── */}
      {kardexProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={cn('rounded-2xl border p-6 w-full max-w-2xl my-8 shadow-2xl', card)}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className={cn('text-lg font-bold', textPrimary)}>📋 Kardex de Stock</h3>
                <p className={cn('text-sm', textSecondary)}>{kardexProduct.name} · Stock actual: <strong>{kardexProduct.stock}</strong></p>
              </div>
              <button onClick={() => setKardexProduct(null)} className="text-gray-400 hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn('border-b text-left', darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500')}>
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Referencia</th>
                    <th className="py-2 pr-4 text-right">Cantidad</th>
                    <th className="py-2 text-right">Stock resultante</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', darkMode ? 'divide-gray-800/40' : 'divide-gray-100')}>
                  {getKardexForProduct(kardexProduct.id).map((ev, i) => (
                    <tr key={i} className={cn(darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50')}>
                      <td className="py-2 pr-4 text-gray-500">
                        {new Date(ev.date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={cn('px-2 py-0.5 rounded-full font-semibold',
                          ev.type === 'venta' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        )}>
                          {ev.type === 'venta' ? '📤 Salida' : '📥 Entrada'}
                        </span>
                      </td>
                      <td className={cn('py-2 pr-4 font-mono', textSecondary)}>{ev.ref}</td>
                      <td className={cn('py-2 pr-4 text-right font-bold', ev.type === 'venta' ? 'text-red-400' : 'text-emerald-400')}>
                        {ev.type === 'venta' ? `-${ev.qty}` : `+${ev.qty}`}
                      </td>
                      <td className={cn('py-2 text-right font-bold', textPrimary)}>{ev.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className={cn('rounded-2xl border p-6 w-full max-w-lg my-8 shadow-2xl', card)}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={cn('text-lg font-bold', textPrimary)}>{editingProduct ? 'Editar producto' : 'Agregar producto'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50', inputClass)} />
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>SKU</label>
                <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Código de barras</label>
                <input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="7700000000000" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Precio venta *</label>
                <input type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} placeholder="0" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Costo</label>
                <input type="number" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} placeholder="0" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Stock actual</label>
                <input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} placeholder="0" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Stock mínimo</label>
                <input type="number" value={form.minStock || ''} onChange={e => setForm(f => ({ ...f, minStock: parseInt(e.target.value) || 0 }))} placeholder="5" className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)} />
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Categoría</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>IVA / Impuesto</label>
                <select value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) }))} className={cn('w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none', inputClass)}>
                  <option value={0}>Sin impuesto (0%)</option>
                  <option value={0.05}>5%</option>
                  <option value={0.08}>8%</option>
                  <option value={0.19}>IVA 19%</option>
                </select>
              </div>
              {form.price > 0 && form.cost > 0 && (
                <div className="col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-400">Margen de ganancia</span>
                    <span className="text-emerald-400 font-bold">{((form.price - form.cost) / form.price * 100).toFixed(1)}% · {formatCurrency(form.price - form.cost)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className={cn('flex-1 py-2.5 rounded-xl border text-sm transition-colors', darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!form.name || form.price <= 0} className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                {editingProduct ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn('rounded-2xl border p-6 w-full max-w-sm shadow-2xl', card)}>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className={cn('text-lg font-bold text-center mb-2', textPrimary)}>¿Eliminar producto?</h3>
            <p className={cn('text-sm text-center mb-5', textSecondary)}>Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className={cn('flex-1 py-2.5 rounded-xl border text-sm', darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
