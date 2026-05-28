import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useStore } from '../store/useStore';
import { formatCurrency, getDaysAgo, formatShortDate, cn } from '../utils/helpers';

const COLORS = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];

export default function Reports() {
  const { sales, darkMode } = useStore();

  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  const tooltipStyle = {
    backgroundColor: darkMode ? '#111827' : '#fff',
    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
    borderRadius: '12px',
    color: darkMode ? '#f9fafb' : '#111827',
  };

  // Last 30 days revenue
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = getDaysAgo(29 - i);
    const ds = sales.filter(s => {
      const sd = new Date(s.createdAt);
      return sd >= d && sd < new Date(d.getTime() + 86400000);
    });
    return {
      day: formatShortDate(d.toISOString()),
      ventas: ds.reduce((sum, s) => sum + s.total, 0),
      transacciones: ds.length,
      margen: ds.reduce((sum, s) => sum + s.items.reduce((p, i) => p + (i.product.price - i.product.cost) * i.quantity, 0), 0),
    };
  });

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  sales.slice(0, 300).forEach(s => {
    s.items.forEach(item => {
      categoryMap[item.product.category] = (categoryMap[item.product.category] || 0) + item.subtotal;
    });
  });
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Hourly pattern (all sales)
  const hourlyPattern = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7;
    const hourSales = sales.filter(s => new Date(s.createdAt).getHours() === hour);
    return {
      hora: `${hour}h`,
      ventas: hourSales.reduce((sum, s) => sum + s.total, 0),
      count: hourSales.length,
    };
  });

  // Top products by revenue
  const productMap: Record<string, { name: string; revenue: number; qty: number; margin: number }> = {};
  sales.slice(0, 300).forEach(s => {
    s.items.forEach(item => {
      const pid = item.product.id;
      if (!productMap[pid]) productMap[pid] = { name: item.product.name, revenue: 0, qty: 0, margin: 0 };
      productMap[pid].revenue += item.subtotal;
      productMap[pid].qty += item.quantity;
      productMap[pid].margin += (item.product.price - item.product.cost) * item.quantity;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const topByMargin = Object.values(productMap).sort((a, b) => b.margin - a.margin).slice(0, 5);

  // Payment method distribution
  const paymentMap: Record<string, number> = {};
  sales.forEach(s => {
    s.payments.forEach(p => {
      paymentMap[p.method] = (paymentMap[p.method] || 0) + p.amount;
    });
  });
  const paymentData = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));

  // KPIs
  const totalRevenue = sales.reduce((s, r) => s + r.total, 0);
  const totalTransactions = sales.length;
  const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalMargin = sales.reduce((sum, s) => sum + s.items.reduce((p, i) => p + (i.product.price - i.product.cost) * i.quantity, 0), 0);
  const marginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos totales', value: formatCurrency(totalRevenue), sub: 'Últimos 30 días', color: 'text-violet-400' },
          { label: 'Transacciones', value: totalTransactions.toLocaleString('es-CO'), sub: 'Total registradas', color: 'text-blue-400' },
          { label: 'Ticket promedio', value: formatCurrency(avgTicket), sub: 'Por venta', color: 'text-amber-400' },
          { label: 'Margen bruto', value: `${marginPct.toFixed(1)}%`, sub: formatCurrency(totalMargin), color: 'text-emerald-400' },
        ].map(k => (
          <div key={k.label} className={cn('rounded-2xl border p-5', card)}>
            <p className={cn('text-xs mb-2', textSecondary)}>{k.label}</p>
            <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue 30 days */}
      <div className={cn('rounded-2xl border p-6', card)}>
        <h3 className={cn('font-semibold mb-1', textPrimary)}>Tendencia de ingresos — 30 días</h3>
        <p className={cn('text-xs mb-4', textSecondary)}>Ventas diarias y margen bruto</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={last30} margin={{ top: 0, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#f3f4f6'} />
            <XAxis dataKey="day" tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `$${(v / 1000).toFixed(0)}k` : '0'} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
            <Line type="monotone" dataKey="ventas" stroke="#7c3aed" strokeWidth={2} dot={false} name="Ventas" />
            <Line type="monotone" dataKey="margen" stroke="#10b981" strokeWidth={2} dot={false} name="Margen" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly pattern */}
        <div className={cn('rounded-2xl border p-6', card)}>
          <h3 className={cn('font-semibold mb-1', textPrimary)}>Patrón de ventas por hora</h3>
          <p className={cn('text-xs mb-4', textSecondary)}>Horas pico del negocio (histórico)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyPattern} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1f2937' : '#f3f4f6'} />
              <XAxis dataKey="hora" tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: darkMode ? '#6b7280' : '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? `$${(v / 1000).toFixed(0)}k` : '0'} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Bar dataKey="ventas" fill="#7c3aed" radius={[4, 4, 0, 0]} opacity={0.85} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className={cn('rounded-2xl border p-6', card)}>
          <h3 className={cn('font-semibold mb-1', textPrimary)}>Ventas por categoría</h3>
          <p className={cn('text-xs mb-4', textSecondary)}>Distribución de ingresos</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData.slice(0, 6)}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {categoryData.slice(0, 6).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => formatCurrency(Number(v))} />
              <Legend formatter={(value) => <span style={{ color: darkMode ? '#9ca3af' : '#6b7280', fontSize: 11 }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products revenue */}
        <div className={cn('rounded-2xl border p-6', card)}>
          <h3 className={cn('font-semibold mb-4', textPrimary)}>Top productos por ingresos</h3>
          <div className="space-y-3">
            {topProducts.map((p, idx) => {
              const pct = (p.revenue / (topProducts[0]?.revenue || 1)) * 100;
              return (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('text-xs font-bold w-4', idx === 0 ? 'text-amber-400' : textSecondary)}>#{idx + 1}</span>
                      <span className={cn('text-xs truncate', textPrimary)}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{p.qty} u</span>
                      <span className={cn('text-xs font-bold', textPrimary)}>{formatCurrency(p.revenue).replace('COP', '').trim()}</span>
                    </div>
                  </div>
                  <div className={cn('h-1.5 rounded-full', darkMode ? 'bg-gray-800' : 'bg-gray-100')}>
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top by margin + payment methods */}
        <div className="space-y-4">
          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-semibold mb-4', textPrimary)}>Top por margen bruto</h3>
            <div className="space-y-2.5">
              {topByMargin.map((p, idx) => {
                const marginPctProd = p.revenue > 0 ? (p.margin / p.revenue) * 100 : 0;
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className={cn('text-xs font-bold w-4 flex-shrink-0', idx === 0 ? 'text-amber-400' : textSecondary)}>#{idx + 1}</span>
                    <span className={cn('text-xs flex-1 truncate', textPrimary)}>{p.name}</span>
                    <span className="text-xs text-emerald-400 font-semibold">{marginPctProd.toFixed(1)}%</span>
                    <span className="text-xs text-gray-500">{formatCurrency(p.margin).replace('COP', '').trim()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={cn('rounded-2xl border p-6', card)}>
            <h3 className={cn('font-semibold mb-4', textPrimary)}>Métodos de pago</h3>
            <div className="space-y-3">
              {paymentData.map(({ name, value }, idx) => {
                const total = paymentData.reduce((s, d) => s + d.value, 0);
                const pct = (value / total) * 100;
                return (
                  <div key={name}>
                    <div className="flex justify-between mb-1">
                      <span className={cn('text-xs', textPrimary)}>{name}</span>
                      <div className="flex gap-2">
                        <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                        <span className={cn('text-xs font-medium', textPrimary)}>{formatCurrency(value).replace('COP', '').trim()}</span>
                      </div>
                    </div>
                    <div className={cn('h-2 rounded-full', darkMode ? 'bg-gray-800' : 'bg-gray-100')}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
