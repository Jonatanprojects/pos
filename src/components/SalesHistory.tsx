import { useState } from 'react';
import { Search, Eye, X, ReceiptText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, isToday, isYesterday, cn } from '../utils/helpers';
import { Sale } from '../types';

const FILTERS = ['Todas', 'Hoy', 'Ayer', '7 días', '30 días'];
const PAYMENT_FILTERS = ['Todos', 'Efectivo', 'Tarjeta', 'Transferencia', 'Nequi'];

export default function SalesHistory() {
  const { sales, darkMode } = useStore();
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('Hoy');
  const [paymentFilter, setPaymentFilter] = useState('Todos');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode
    ? 'bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500';

  const now = new Date();
  const filtered = sales.filter(s => {
    const sDate = new Date(s.createdAt);
    let matchPeriod = true;
    if (period === 'Hoy') matchPeriod = isToday(s.createdAt);
    else if (period === 'Ayer') matchPeriod = isYesterday(s.createdAt);
    else if (period === '7 días') matchPeriod = sDate >= new Date(now.getTime() - 7 * 86400000);
    else if (period === '30 días') matchPeriod = sDate >= new Date(now.getTime() - 30 * 86400000);

    const matchPayment = paymentFilter === 'Todos' || s.payments.some(p => p.method === paymentFilter);
    const matchSearch = !search || s.id.toLowerCase().includes(search.toLowerCase()) || s.cashier.toLowerCase().includes(search.toLowerCase());
    return matchPeriod && matchPayment && matchSearch;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;
  const totalProfit = filtered.reduce((sum, s) => {
    return sum + s.items.reduce((p, i) => p + (i.product.price - i.product.cost) * i.quantity, 0);
  }, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos', value: formatCurrency(totalRevenue), color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Transacciones', value: filtered.length.toString(), color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Ticket promedio', value: formatCurrency(avgTicket), color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Margen bruto', value: formatCurrency(totalProfit), color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl border p-4', card)}>
            <p className={cn('text-xs mb-1', textSecondary)}>{s.label}</p>
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={cn('rounded-2xl border p-4', card)}>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por ID o cajero..."
              className={cn('pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none', inputClass)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setPeriod(f)}
                className={cn('text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  period === f ? 'bg-violet-600/20 border-violet-500/50 text-violet-300' :
                  darkMode ? 'border-gray-700 text-gray-400 hover:border-gray-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className={cn('px-3 py-2 rounded-xl border text-sm focus:outline-none ml-auto', inputClass)}>
            {PAYMENT_FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={cn('rounded-2xl border overflow-hidden', card)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={cn('border-b text-xs font-medium', darkMode ? 'border-gray-800 text-gray-400 bg-gray-900/60' : 'border-gray-200 text-gray-500 bg-gray-50')}>
                <th className="text-left px-4 py-3">ID Venta</th>
                <th className="text-left px-4 py-3">Fecha y Hora</th>
                <th className="text-left px-4 py-3">Cajero</th>
                <th className="text-center px-4 py-3">Items</th>
                <th className="text-left px-4 py-3">Pago</th>
                <th className="text-right px-4 py-3">Subtotal</th>
                <th className="text-right px-4 py-3">IVA</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Estado</th>
                <th className="text-center px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', darkMode ? 'divide-gray-800/40' : 'divide-gray-100')}>
              {filtered.slice(0, 100).map(s => (
                <tr key={s.id} className={cn('transition-colors cursor-pointer', darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50')} onClick={() => setSelectedSale(s)}>
                  <td className="px-4 py-3"><span className="text-xs font-mono text-violet-400">{s.id}</span></td>
                  <td className="px-4 py-3"><span className={cn('text-xs', textSecondary)}>{formatDate(s.createdAt)}</span></td>
                  <td className="px-4 py-3"><span className={cn('text-sm', textPrimary)}>{s.cashier}</span></td>
                  <td className="px-4 py-3 text-center"><span className={cn('text-sm', textSecondary)}>{s.items.length}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.payments.map((p, i) => (
                        <span key={i} className={cn('text-xs px-1.5 py-0.5 rounded-md',
                          p.method === 'Efectivo' ? 'bg-emerald-500/10 text-emerald-400' :
                          p.method === 'Tarjeta' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-violet-500/10 text-violet-400'
                        )}>{p.method}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right"><span className={cn('text-sm', textSecondary)}>{formatCurrency(s.subtotal)}</span></td>
                  <td className="px-4 py-3 text-right"><span className={cn('text-sm', textSecondary)}>{formatCurrency(s.taxes)}</span></td>
                  <td className="px-4 py-3 text-right"><span className={cn('text-sm font-semibold', textPrimary)}>{formatCurrency(s.total)}</span></td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      s.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    )}>
                      {s.status === 'completed' ? 'Completada' : s.status === 'cancelled' ? 'Cancelada' : 'Devuelta'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <ReceiptText className={cn('w-12 h-12 mx-auto mb-3', textSecondary)} />
              <p className={textSecondary}>No hay ventas en este período</p>
            </div>
          )}
        </div>
        {filtered.length > 100 && (
          <div className={cn('text-center py-3 border-t text-sm', textSecondary, darkMode ? 'border-gray-800' : 'border-gray-200')}>
            Mostrando 100 de {filtered.length} ventas
          </div>
        )}
      </div>

      {/* Sale detail modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={cn('rounded-2xl border p-6 w-full max-w-md shadow-2xl', card)}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-violet-400">{selectedSale.id}</p>
                <h3 className={cn('text-lg font-bold', textPrimary)}>Detalle de venta</h3>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <div className={cn('text-xs mb-4 grid grid-cols-2 gap-2', textSecondary)}>
              <span>📅 {formatDate(selectedSale.createdAt)}</span>
              <span>👤 {selectedSale.cashier}</span>
              <span>🏪 {selectedSale.branch}</span>
              <span className={cn('font-medium', selectedSale.status === 'completed' ? 'text-emerald-400' : 'text-red-400')}>
                {selectedSale.status === 'completed' ? '✅ Completada' : '❌ Cancelada'}
              </span>
            </div>
            <div className={cn('rounded-xl p-3 mb-4 space-y-2', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
              {selectedSale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <p className={textPrimary}>{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × {formatCurrency(item.product.price)}</p>
                  </div>
                  <span className={cn('font-medium', textPrimary)}>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className={textSecondary}>Subtotal</span>
                <span className={textPrimary}>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Descuento</span>
                  <span className="text-emerald-400">-{formatCurrency(selectedSale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className={textSecondary}>IVA/Impuestos</span>
                <span className={textPrimary}>{formatCurrency(selectedSale.taxes)}</span>
              </div>
              <div className={cn('flex justify-between font-bold pt-2 border-t', darkMode ? 'border-gray-700' : 'border-gray-200')}>
                <span className={textPrimary}>Total</span>
                <span className="text-violet-400 text-lg">{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedSale.payments.map((p, i) => (
                <span key={i} className={cn('text-xs px-3 py-1.5 rounded-lg font-medium',
                  p.method === 'Efectivo' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-blue-500/10 text-blue-400'
                )}>
                  {p.method}: {formatCurrency(p.amount)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
