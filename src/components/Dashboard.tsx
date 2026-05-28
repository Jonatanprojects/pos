import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, AlertTriangle, ArrowUpRight, Clock, Target } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency, isToday, isYesterday, getHour, formatShortDate, getDaysAgo } from '../utils/helpers';
import { cn } from '../utils/helpers';

export default function Dashboard() {
  const { sales, products, darkMode, setActiveModule } = useStore();

  const todaySales = sales.filter(s => isToday(s.createdAt));
  const yesterdaySales = sales.filter(s => isYesterday(s.createdAt));

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.total, 0);
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  const todayTickets = todaySales.length;
  const avgTicket = todayTickets > 0 ? todayRevenue / todayTickets : 0;
  const yesterdayAvgTicket = yesterdaySales.length > 0 ? yesterdayRevenue / yesterdaySales.length : 0;
  const avgChange = yesterdayAvgTicket > 0 ? ((avgTicket - yesterdayAvgTicket) / yesterdayAvgTicket) * 100 : 0;

  const todayProfit = todaySales.reduce((sum, s) => {
    const profit = s.items.reduce((p, i) => p + (i.product.price - i.product.cost) * i.quantity, 0);
    return sum + profit;
  }, 0);

  const lowStockProducts = products.filter(p => p.stock <= p.minStock && p.active);

  // Hourly sales today
  const hourlyData = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7;
    const hourSales = todaySales.filter(s => getHour(s.createdAt) === hour);
    return {
      hour: `${hour}:00`,
      ventas: hourSales.reduce((sum, s) => sum + s.total, 0),
      transacciones: hourSales.length,
    };
  });

  // Last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = getDaysAgo(13 - i);
    const ds = sales.filter(s => {
      const sd = new Date(s.createdAt);
      return sd >= d && sd < new Date(d.getTime() + 86400000);
    });
    return {
      day: formatShortDate(d.toISOString()),
      ventas: ds.reduce((sum, s) => sum + s.total, 0),
      margen: ds.reduce((sum, s) => {
        const profit = s.items.reduce((p, i) => p + (i.product.price - i.product.cost) * i.quantity, 0);
        return sum + profit;
      }, 0),
    };
  });

  // Top products (all-time, simplified to last 30 days)
  const productMap: Record<string, { name: string; qty: number; revenue: number; profit: number }> = {};
  sales.slice(0, 200).forEach(s => {
    s.items.forEach(item => {
      const pid = item.product.id;
      if (!productMap[pid]) productMap[pid] = { name: item.product.name, qty: 0, revenue: 0, profit: 0 };
      productMap[pid].qty += item.quantity;
      productMap[pid].revenue += item.subtotal;
      productMap[pid].profit += (item.product.price - item.product.cost) * item.quantity;
    });
  });

  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const cardDark = 'bg-gray-900/80 border-gray-800/60';
  const cardLight = 'bg-white border-gray-200';
  const card = darkMode ? cardDark : cardLight;
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const StatCard = ({ title, value, change, icon: Icon, iconColor, prefix = '', suffix = '', onClick }: {
    title: string; value: number; change?: number; icon: React.ElementType;
    iconColor: string; prefix?: string; suffix?: string; onClick?: () => void;
  }) => (
    <div onClick={onClick} className={cn('rounded-2xl border p-6 transition-all duration-200', card, onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : '')}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className={cn('text-sm mb-1', textSecondary)}>{title}</p>
      <p className={cn('text-2xl font-bold', textPrimary)}>
        {prefix}{typeof value === 'number' ? (value >= 1000 ? formatCurrency(value).replace('COP', '').trim() : value.toLocaleString('es-CO')) : value}{suffix}
      </p>
      {change !== undefined && (
        <p className="text-xs text-gray-500 mt-1">vs. ayer</p>
      )}
    </div>
  );

  const tooltipStyle = {
    backgroundColor: darkMode ? '#111827' : '#fff',
    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
    borderRadius: '12px',
    color: darkMode ? '#f9fafb' : '#111827',
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas hoy"
          value={todayRevenue}
          change={revenueChange}
          icon={DollarSign}
          iconColor="bg-violet-500/20 text-violet-400"
          onClick={() => setActiveModule('sales')}
        />
        <StatCard
          title="Transacciones"
          value={todayTickets}
          icon={ShoppingCart}
          iconColor="bg-blue-500/20 text-blue-400"
          change={yesterdaySales.length > 0 ? ((todayTickets - yesterdaySales.length) / yesterdaySales.length) * 100 : 0}
          onClick={() => setActiveModule('sales')}
        />
        <StatCard
          title="Ticket promedio"
          value={avgTicket}
          change={avgChange}
          icon={Target}
          iconColor="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          title="Margen bruto hoy"
          value={todayProfit}
          icon={TrendingUp}
          iconColor="bg-amber-500/20 text-amber-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales by hour */}
        <div className={cn('lg:col-span-2 rounded-2xl border p-6', card)}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={cn('font-semibold', textPrimary)}>Ventas por hora — Hoy</h3>
              <p className={cn('text-xs mt-0.5', textSecondary)}>Distribución de ventas del día actual</p>
            </div>
            <div className={cn('flex items-center gap-1.5 text-xs', textSecondary)}>
              <Clock className="w-3.5 h-3.5" />
              Tiempo real
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#f3f4f6'} />
              <XAxis dataKey="hour" tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `$${(v/1000).toFixed(0)}k` : '0'} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v)), 'Ventas']} />
              <Area type="monotone" dataKey="ventas" stroke="#7c3aed" strokeWidth={2} fill="url(#colorVentas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className={cn('rounded-2xl border p-6', card)}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className={cn('font-semibold', textPrimary)}>Stock bajo</h3>
            {lowStockProducts.length > 0 && (
              <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">{lowStockProducts.length}</span>
            )}
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-emerald-400 font-medium">¡Stock OK!</p>
                <p className={cn('text-xs mt-1', textSecondary)}>Todos los productos tienen stock suficiente</p>
              </div>
            ) : (
              lowStockProducts.slice(0, 6).map(p => (
                <div key={p.id} className={cn('flex items-center justify-between p-2.5 rounded-xl', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-xs font-medium truncate', textPrimary)}>{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <span className={cn('text-sm font-bold', p.stock === 0 ? 'text-red-400' : 'text-amber-400')}>{p.stock}</span>
                    <p className="text-xs text-gray-500">/{p.minStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {lowStockProducts.length > 0 && (
            <button onClick={() => setActiveModule('inventory')} className="mt-4 w-full text-xs text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1 transition-colors">
              Ver inventario <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 14 day trend + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 14 day chart */}
        <div className={cn('lg:col-span-2 rounded-2xl border p-6', card)}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={cn('font-semibold', textPrimary)}>Tendencia — últimos 14 días</h3>
              <p className={cn('text-xs mt-0.5', textSecondary)}>Ventas vs margen bruto</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-violet-400"><span className="w-3 h-0.5 bg-violet-500 rounded-full inline-block" /> Ventas</span>
              <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block" /> Margen</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last14Days} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#f3f4f6'} />
              <XAxis dataKey="day" tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `$${(v/1000).toFixed(0)}k` : '0'} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Bar dataKey="ventas" fill="#7c3aed" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="margen" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className={cn('rounded-2xl border p-6', card)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn('font-semibold', textPrimary)}>Top Productos</h3>
            <span className={cn('text-xs', textSecondary)}>por ventas</span>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, idx) => {
              const maxRevenue = topProducts[0]?.revenue || 1;
              const pct = (p.revenue / maxRevenue) * 100;
              return (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('text-xs font-bold w-4 flex-shrink-0', idx === 0 ? 'text-amber-400' : textSecondary)}>#{idx + 1}</span>
                      <span className={cn('text-xs truncate', textPrimary)}>{p.name}</span>
                    </div>
                    <span className={cn('text-xs font-semibold ml-2 flex-shrink-0', textPrimary)}>{formatCurrency(p.revenue).replace('COP', '').trim()}</span>
                  </div>
                  <div className={cn('h-1.5 rounded-full', darkMode ? 'bg-gray-800' : 'bg-gray-100')}>
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => setActiveModule('reports')} className="mt-4 w-full text-xs text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1 transition-colors">
            Ver reportes completos <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Recent transactions */}
      <div className={cn('rounded-2xl border p-6', card)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('font-semibold', textPrimary)}>Últimas transacciones hoy</h3>
          <button onClick={() => setActiveModule('sales')} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            Ver todas <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        {todaySales.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className={cn('w-10 h-10 mx-auto mb-2', textSecondary)} />
            <p className={cn('text-sm', textSecondary)}>No hay ventas hoy aún</p>
            <button onClick={() => setActiveModule('pos')} className="mt-3 text-xs text-violet-400 hover:text-violet-300">Ir al POS →</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['ID', 'Hora', 'Items', 'Cajero', 'Pago', 'Total'].map(h => (
                    <th key={h} className={cn('text-left text-xs font-medium pb-3 pr-4', textSecondary)}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {todaySales.slice(0, 8).map(s => (
                  <tr key={s.id} className={cn('transition-colors', darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50')}>
                    <td className="py-2.5 pr-4"><span className="text-xs font-mono text-violet-400">{s.id}</span></td>
                    <td className="py-2.5 pr-4"><span className={cn('text-xs', textSecondary)}>{new Date(s.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td className="py-2.5 pr-4"><span className={cn('text-xs', textPrimary)}>{s.items.length} item{s.items.length !== 1 ? 's' : ''}</span></td>
                    <td className="py-2.5 pr-4"><span className={cn('text-xs', textSecondary)}>{s.cashier}</span></td>
                    <td className="py-2.5 pr-4">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', s.payments[0]?.method === 'Efectivo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400')}>
                        {s.payments[0]?.method}
                      </span>
                    </td>
                    <td className="py-2.5"><span className={cn('text-sm font-semibold', textPrimary)}>{formatCurrency(s.total)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
