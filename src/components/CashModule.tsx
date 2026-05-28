import { useState } from 'react';
import { Lock, Unlock, TrendingUp, Calculator, Printer, History, Coins, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatDate, cn } from '../utils/helpers';

const DENOMINATIONS = [
  { value: 100000, label: 'Billete $100.000', isBill: true },
  { value: 50000, label: 'Billete $50.000', isBill: true },
  { value: 20000, label: 'Billete $20.000', isBill: true },
  { value: 10000, label: 'Billete $10.000', isBill: true },
  { value: 5000, label: 'Billete $5.000', isBill: true },
  { value: 2000, label: 'Billete $2.000', isBill: true },
  { value: 1000, label: 'Moneda $1.000', isBill: false },
  { value: 500, label: 'Moneda $500', isBill: false },
  { value: 200, label: 'Moneda $200', isBill: false },
  { value: 100, label: 'Moneda $100', isBill: false },
  { value: 50, label: 'Moneda $50', isBill: false },
];

export default function CashModule() {
  const { cashSession, cashSessionsHistory, openCashSession, closeCashSession, sales, darkMode, currentUser } = useStore();
  const [initialCash, setInitialCash] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'history'>('status');

  // Audit state
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [directAmount, setDirectAmount] = useState('');
  const [auditMode, setAuditMode] = useState<'detailed' | 'direct'>('detailed');
  const [notes, setNotes] = useState('');

  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode
    ? 'bg-gray-800/60 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500';

  // Current session sales
  const sessionSales = cashSession
    ? sales.filter(s => s.createdAt >= cashSession.openedAt && s.status === 'completed')
    : [];

  const cashInflow = cashSession ? sessionSales.reduce((sum, s) => {
    return sum + s.payments.filter(p => p.method === 'Efectivo').reduce((a, p) => a + p.amount, 0);
  }, 0) : 0;

  const cardInflow = cashSession ? sessionSales.reduce((sum, s) => {
    return sum + s.payments.filter(p => p.method === 'Tarjeta').reduce((a, p) => a + p.amount, 0);
  }, 0) : 0;

  const transferInflow = cashSession ? sessionSales.reduce((sum, s) => {
    return sum + s.payments.filter(p => p.method !== 'Efectivo' && p.method !== 'Tarjeta').reduce((a, p) => a + p.amount, 0);
  }, 0) : 0;

  const totalInflow = cashInflow + cardInflow + transferInflow;
  const expectedCash = cashSession ? (cashSession.initialAmount + cashInflow) : 0;

  // Calculate detailed counted cash
  const detailedTotal = DENOMINATIONS.reduce((sum, d) => {
    const qty = counts[d.value] || 0;
    return sum + d.value * qty;
  }, 0);

  const actualCashCounted = auditMode === 'detailed' ? detailedTotal : parseFloat(directAmount) || 0;
  const difference = actualCashCounted - expectedCash;

  const handleOpen = () => {
    const amount = parseFloat(initialCash.replace(/[^0-9.]/g, '')) || 0;
    openCashSession(amount);
    setInitialCash('');
  };

  const handleCloseConfirm = () => {
    const recordDenominations: Record<string, number> = {};
    if (auditMode === 'detailed') {
      Object.entries(counts).forEach(([val, qty]) => {
        if (qty > 0) recordDenominations[val] = qty;
      });
    }

    closeCashSession(actualCashCounted, expectedCash, difference, notes, recordDenominations);
    setShowCloseModal(false);
    // Reset audit states
    setCounts({});
    setDirectAmount('');
    setNotes('');
  };

  const handleQuantityChange = (value: number, qty: number) => {
    setCounts(prev => ({
      ...prev,
      [value]: Math.max(0, qty)
    }));
  };

  const printSessionReport = (session: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get today sales for this session
    const printSales = sales.filter(s => s.createdAt >= session.openedAt && (session.closedAt ? s.createdAt <= session.closedAt : true) && s.status === 'completed');
    const cashSales = printSales.reduce((sum, s) => {
      const cash = s.payments.find(p => p.method === 'Efectivo');
      return sum + (cash?.amount || 0);
    }, 0);
    const cardSales = printSales.reduce((sum, s) => {
      const card = s.payments.find(p => p.method === 'Tarjeta');
      return sum + (card?.amount || 0);
    }, 0);
    const otherSales = printSales.reduce((sum, s) => {
      const other = s.payments.find(p => p.method !== 'Efectivo' && p.method !== 'Tarjeta');
      return sum + (other?.amount || 0);
    }, 0);

    const diffText = session.difference !== undefined
      ? session.difference === 0 ? 'CUADRADO ($0)' : session.difference > 0 ? `SOBRANTE (+${formatCurrency(session.difference)})` : `FALTANTE (${formatCurrency(session.difference)})`
      : 'N/A';

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Caja - ${session.id}</title>
          <style>
            @media print {
              body { width: 80mm; margin: 0; padding: 5mm; font-family: 'Courier New', Courier, monospace; font-size: 12px; }
            }
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2 class="center" style="margin:0 0 5px 0;">NEXUS POS</h2>
          <p class="center" style="margin:0;">CORTE DE CAJA / ARQUEO</p>
          <div class="divider"></div>
          <div class="row"><span class="bold">Caja ID:</span><span>${session.id}</span></div>
          <div class="row"><span class="bold">Cajero:</span><span>${session.cashier}</span></div>
          <div class="row"><span>Apertura:</span><span>${new Date(session.openedAt).toLocaleDateString()} ${new Date(session.openedAt).toLocaleTimeString()}</span></div>
          ${session.closedAt ? `<div class="row"><span>Cierre:</span><span>${new Date(session.closedAt).toLocaleDateString()} ${new Date(session.closedAt).toLocaleTimeString()}</span></div>` : ''}
          <div class="row"><span class="bold">Estado:</span><span>${session.status.toUpperCase()}</span></div>
          <div class="divider"></div>
          
          <div class="row"><span class="bold">Base Inicial:</span><span>${formatCurrency(session.initialAmount)}</span></div>
          <div class="row"><span>Ventas Efectivo:</span><span>+${formatCurrency(cashSales)}</span></div>
          <div class="row"><span class="bold">Efectivo Esperado:</span><span>${formatCurrency(session.initialAmount + cashSales)}</span></div>
          
          ${session.closedAt ? `
          <div class="row"><span class="bold">Efectivo Real:</span><span>${formatCurrency(session.actualAmount)}</span></div>
          <div class="row"><span class="bold">Diferencia:</span><span>${diffText}</span></div>
          ` : ''}
          
          <div class="divider"></div>
          <p class="bold" style="margin:5px 0 3px 0;">OTROS MEDIOS DE PAGO</p>
          <div class="row"><span>Ventas Tarjeta:</span><span>${formatCurrency(cardSales)}</span></div>
          <div class="row"><span>Otras Ventas:</span><span>${formatCurrency(otherSales)}</span></div>
          <div class="row"><span class="bold">Total Recaudado:</span><span>${formatCurrency(cashSales + cardSales + otherSales)}</span></div>
          
          ${session.notes ? `
          <div class="divider"></div>
          <p class="bold" style="margin:5px 0 3px 0;">Observaciones:</p>
          <p style="margin:0; font-style:italic;">${session.notes}</p>
          ` : ''}
          
          <div class="divider" style="margin-top:30px;"></div>
          <p class="center" style="margin-top:30px;">_________________________</p>
          <p class="center" style="margin:0;">Firma de Cajero / Responsable</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Sub Tabs */}
      <div className="flex justify-between items-center border-b border-gray-800/40 pb-0">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('status')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-t-xl border border-b-0 transition-all',
              activeSubTab === 'status'
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : darkMode ? 'border-gray-800 text-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-500 hover:text-gray-700'
            )}
          >
            📊 Sesión Activa
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-t-xl border border-b-0 transition-all',
              activeSubTab === 'history'
                ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                : darkMode ? 'border-gray-800 text-gray-500 hover:text-gray-300' : 'border-gray-200 text-gray-500 hover:text-gray-700'
            )}
          >
            📋 Historial de Turnos
          </button>
        </div>
        {cashSession?.status === 'open' && (
          <button
            onClick={() => printSessionReport(cashSession)}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20 mb-1"
          >
            <Printer className="w-3.5 h-3.5" /> Imp. Estado Actual
          </button>
        )}
      </div>

      {/* ─── TAB: SESIÓN ACTIVA ────────────────────────────────────────────── */}
      {activeSubTab === 'status' && (
        <div className="space-y-5">
          {/* Session status info */}
          <div className={cn('rounded-2xl border p-6', card)}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className={cn('text-lg font-bold', textPrimary)}>Control de Caja y Turnos</h2>
                <p className={cn('text-sm', textSecondary)}>{currentUser?.name} · {currentUser?.branch}</p>
              </div>
              <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', cashSession?.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border border-gray-500/30')}>
                {cashSession?.status === 'open' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {cashSession?.status === 'open' ? 'Caja abierta' : 'Caja cerrada'}
              </div>
            </div>

            {!cashSession || cashSession.status === 'closed' ? (
              <div>
                <p className={cn('text-sm mb-4', textSecondary)}>Ingresa el monto inicial en efectivo para comenzar la jornada:</p>
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      value={initialCash}
                      onChange={e => setInitialCash(e.target.value)}
                      placeholder="Monto inicial"
                      className={cn('w-full pl-7 pr-4 py-3 rounded-xl border text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500/50', inputClass)}
                    />
                  </div>
                  <div className="flex gap-2">
                    {[50000, 100000, 200000].map(amt => (
                      <button key={amt} onClick={() => setInitialCash(String(amt))} className={cn('text-xs px-3 py-3 rounded-xl border transition-colors', darkMode ? 'border-gray-700 text-gray-400 hover:border-violet-500 hover:text-violet-400' : 'border-gray-300 text-gray-500 hover:border-violet-400')}>
                        ${(amt / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                  <button onClick={handleOpen} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/25">
                    <Unlock className="w-4 h-4" /> Abrir caja
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div className={cn('rounded-xl p-4', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                    <p className={cn('text-xs mb-1', textSecondary)}>Apertura</p>
                    <p className={cn('text-sm font-medium', textPrimary)}>{formatDate(cashSession.openedAt)}</p>
                  </div>
                  <div className={cn('rounded-xl p-4', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                    <p className={cn('text-xs mb-1', textSecondary)}>Monto inicial (Base)</p>
                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(cashSession.initialAmount)}</p>
                  </div>
                  <div className={cn('rounded-xl p-4', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                    <p className={cn('text-xs mb-1', textSecondary)}>Efectivo en caja esperado</p>
                    <p className="text-lg font-bold text-violet-400">{formatCurrency(expectedCash)}</p>
                  </div>
                  <div className={cn('rounded-xl p-4', darkMode ? 'bg-gray-800/50' : 'bg-gray-50')}>
                    <p className={cn('text-xs mb-1', textSecondary)}>Ventas de esta sesión</p>
                    <p className={cn('text-lg font-bold', textPrimary)}>{sessionSales.length}</p>
                  </div>
                </div>

                {/* Payment breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Efectivo Recaudado', amount: cashInflow, color: 'text-emerald-400', dot: 'bg-emerald-400' },
                    { label: 'Tarjeta Recaudado', amount: cardInflow, color: 'text-blue-400', dot: 'bg-blue-400' },
                    { label: 'Transferencia/Digital', amount: transferInflow, color: 'text-violet-400', dot: 'bg-violet-400' },
                  ].map((p, idx) => (
                    <div key={idx} className={cn('rounded-xl p-4 border', card)}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn('w-2 h-2 rounded-full', p.dot)} />
                        <p className={cn('text-xs', textSecondary)}>{p.label}</p>
                      </div>
                      <p className={cn('text-lg font-bold', p.color)}>{formatCurrency(p.amount)}</p>
                    </div>
                  ))}
                </div>

                {/* Total box */}
                <div className={cn('rounded-xl p-4 mb-5 flex items-center justify-between', darkMode ? 'bg-violet-600/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200')}>
                  <div>
                    <p className={cn('text-sm', textSecondary)}>Total recaudado en el turno</p>
                    <p className="text-2xl font-bold text-violet-400">{formatCurrency(totalInflow)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-violet-400/50" />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCounts({});
                      setDirectAmount('');
                      setNotes('');
                      setAuditMode('detailed');
                      setShowCloseModal(true);
                    }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/10"
                  >
                    <Lock className="w-4 h-4" /> Realizar Arqueo y Cerrar Caja
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recent transactions in session */}
          {cashSession?.status === 'open' && sessionSales.length > 0 && (
            <div className={cn('rounded-2xl border', card)}>
              <div className={cn('px-5 py-4 border-b flex items-center justify-between', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
                <h3 className={cn('font-semibold', textPrimary)}>Transacciones de la sesión</h3>
                <span className={cn('text-sm', textSecondary)}>{sessionSales.length} ventas · {formatCurrency(totalInflow)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={cn('border-b text-xs font-medium', darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500')}>
                      <th className="text-left px-5 py-3">Hora</th>
                      <th className="text-left px-5 py-3">ID Venta</th>
                      <th className="text-left px-5 py-3">Formas de Pago</th>
                      <th className="text-right px-5 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', darkMode ? 'divide-gray-800/40' : 'divide-gray-100')}>
                    {sessionSales.slice(0, 15).map(s => (
                      <tr key={s.id}>
                        <td className={cn('px-5 py-3 text-sm', textSecondary)}>
                          {new Date(s.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-violet-400">{s.id}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5">
                            {s.payments.map((p, i) => (
                              <span key={i} className={cn('text-[10px] px-2 py-0.5 rounded font-medium',
                                p.method === 'Efectivo' ? 'bg-emerald-500/10 text-emerald-400' :
                                p.method === 'Tarjeta' ? 'bg-blue-500/10 text-blue-400' :
                                'bg-violet-500/10 text-violet-400'
                              )}>{p.method} ({formatCurrency(p.amount)})</span>
                            ))}
                          </div>
                        </td>
                        <td className={cn('px-5 py-3 text-right font-semibold', textPrimary)}>{formatCurrency(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: HISTORIAL DE TURNOS ───────────────────────────────────────── */}
      {activeSubTab === 'history' && (
        <div className={cn('rounded-2xl border', card)}>
          <div className={cn('px-5 py-4 border-b', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
            <h3 className={cn('font-semibold', textPrimary)}>Sesiones de Caja Anteriores</h3>
          </div>
          <div className="overflow-x-auto">
            {cashSessionsHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No se registran cierres de caja en el historial local.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={cn('border-b text-xs font-medium', darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500')}>
                    <th className="text-left px-5 py-3">ID Turno</th>
                    <th className="text-left px-5 py-3">Cajero</th>
                    <th className="text-left px-5 py-3">Apertura / Cierre</th>
                    <th className="text-right px-5 py-3">Monto Base</th>
                    <th className="text-right px-5 py-3">Efectivo Esperado</th>
                    <th className="text-right px-5 py-3">Efectivo Real</th>
                    <th className="text-right px-5 py-3">Diferencia</th>
                    <th className="text-center px-5 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', darkMode ? 'divide-gray-800/40' : 'divide-gray-100')}>
                  {cashSessionsHistory.map(session => {
                    const diff = session.difference ?? 0;
                    return (
                      <tr key={session.id} className={cn(darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50')}>
                        <td className="px-5 py-3 font-mono text-xs text-violet-400">{session.id}</td>
                        <td className={cn('px-5 py-3 font-medium', textPrimary)}>{session.cashier}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          <div>A: {new Date(session.openedAt).toLocaleString('es-CO')}</div>
                          {session.closedAt && <div>C: {new Date(session.closedAt).toLocaleString('es-CO')}</div>}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-400">{formatCurrency(session.initialAmount)}</td>
                        <td className="px-5 py-3 text-right text-gray-400">{formatCurrency(session.expectedAmount ?? 0)}</td>
                        <td className="px-5 py-3 text-right font-bold text-violet-400">{formatCurrency(session.finalAmount ?? 0)}</td>
                        <td className={cn('px-5 py-3 text-right font-bold',
                          diff === 0 ? 'text-emerald-400' : diff > 0 ? 'text-blue-400' : 'text-red-400'
                        )}>
                          {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => printSessionReport(session)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                            title="Imprimir ticket de corte"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── ARQUEO DE CAJA MODAL (CONTEO DE BILLETES Y MONEDAS) ─────────────── */}
      {showCloseModal && cashSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={cn('rounded-2xl border p-6 w-full max-w-2xl my-8 shadow-2xl flex flex-col', card)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={cn('text-lg font-bold flex items-center gap-2', textPrimary)}>
                  <Calculator className="w-5 h-5 text-violet-400" />
                  Arqueo de Caja / Cuadre de Turno
                </h3>
                <p className="text-xs text-gray-500">Sesión: {cashSession.id}</p>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-gray-200">
                &times;
              </button>
            </div>

            {/* Content area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh] pr-1">
              {/* Left Column: Denominations count */}
              <div className="space-y-4">
                <div className="flex rounded-lg overflow-hidden border border-gray-700">
                  <button
                    onClick={() => setAuditMode('detailed')}
                    className={cn('flex-1 py-2 text-xs font-semibold transition-colors', auditMode === 'detailed' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800')}
                  >
                    🪙 Conteo Detallado
                  </button>
                  <button
                    onClick={() => setAuditMode('direct')}
                    className={cn('flex-1 py-2 text-xs font-semibold transition-colors', auditMode === 'direct' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-800')}
                  >
                    💵 Monto Directo
                  </button>
                </div>

                {auditMode === 'detailed' ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {DENOMINATIONS.map(d => (
                      <div key={d.value} className={cn('flex items-center justify-between gap-3 p-2 rounded-xl border border-gray-800/40 bg-gray-900/30')}>
                        <div className="flex items-center gap-2">
                          {d.isBill ? <FileText className="w-4 h-4 text-emerald-400" /> : <Coins className="w-4 h-4 text-amber-400" />}
                          <span className="text-xs font-medium text-gray-300 w-28">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={counts[d.value] || ''}
                            onChange={e => handleQuantityChange(d.value, parseInt(e.target.value) || 0)}
                            className={cn('w-16 px-2 py-1 text-xs text-center rounded-lg border focus:outline-none', inputClass)}
                          />
                          <span className="text-xs text-violet-400 font-bold w-20 text-right">
                            {formatCurrency((counts[d.value] || 0) * d.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 py-8 text-center">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Monto en Efectivo Contado</label>
                    <div className="relative max-w-[240px] mx-auto">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={directAmount}
                        onChange={e => setDirectAmount(e.target.value)}
                        className={cn('w-full pl-8 pr-4 py-3 rounded-xl border text-xl font-bold text-center focus:outline-none focus:ring-1 focus:ring-violet-500/50', inputClass)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Observaciones / Notas del Arqueo</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Escribe comentarios sobre el cuadre de caja aquí..."
                    className={cn('w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-violet-500/50', inputClass)}
                  />
                </div>
              </div>

              {/* Right Column: Calculations and comparison */}
              <div className={cn('rounded-xl p-4 flex flex-col justify-between border', darkMode ? 'bg-gray-800/30' : 'bg-gray-50')}>
                <div className="space-y-3">
                  <h4 className={cn('font-bold text-sm border-b pb-2 mb-3', textPrimary)}>Resumen de Arqueo</h4>
                  <div className="flex justify-between text-xs">
                    <span className={textSecondary}>Monto Inicial (Base)</span>
                    <span className={textPrimary}>{formatCurrency(cashSession.initialAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={textSecondary}>Ventas Efectivo Esperadas</span>
                    <span className="text-emerald-400">+{formatCurrency(cashInflow)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-700/60 pt-2 text-violet-400">
                    <span>Efectivo Esperado en Caja</span>
                    <span>{formatCurrency(expectedCash)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-dashed border-gray-700/60 text-white">
                    <span>Efectivo Real Contado</span>
                    <span>{formatCurrency(actualCashCounted)}</span>
                  </div>

                  <div className="border-t border-gray-700/60 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Diferencia (Cuadre)</span>
                      <span className={cn('text-lg font-black px-2 py-0.5 rounded-lg',
                        difference === 0 ? 'bg-emerald-500/10 text-emerald-400' :
                        difference > 0 ? 'bg-blue-500/10 text-blue-400' :
                        'bg-red-500/10 text-red-400'
                      )}>
                        {difference === 0 ? 'Cuadrado' : difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
                      </span>
                    </div>
                    {difference < 0 && (
                      <p className="text-[10px] text-red-400 mt-2">
                        ⚠️ FALTANTE: El efectivo contado es menor que el esperado por ventas registradas.
                      </p>
                    )}
                    {difference > 0 && (
                      <p className="text-[10px] text-blue-400 mt-2">
                        💡 SOBRANTE: Se ha contado más efectivo del esperado en el cajón de monedas.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCloseModal(false)}
                      className={cn('flex-1 py-2.5 rounded-xl border text-xs font-semibold', darkMode ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCloseConfirm}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      <Lock className="w-4 h-4" /> Confirmar y Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
