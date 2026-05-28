import { useStore } from './store/useStore';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import SalesHistory from './components/SalesHistory';
import CashModule from './components/CashModule';
import Reports from './components/Reports';
import Notifications from './components/Notifications';
import Settings from './components/Settings';
import { cn } from './utils/helpers';

function Customers() {
  const { darkMode } = useStore();
  const card = darkMode ? 'bg-gray-900/80 border-gray-800/60' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className={cn('rounded-2xl border p-12 text-center', card)}>
        <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👥</span>
        </div>
        <h2 className={cn('text-xl font-bold mb-2', textPrimary)}>Módulo de Clientes</h2>
        <p className={cn('text-sm mb-6 max-w-md mx-auto', textSecondary)}>
          Gestión de clientes, historial de compras, programa de fidelización y segmentación.
          Disponible en el plan Profesional — <strong className="text-violet-400">Fase 2</strong>.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto">
          {['Perfil de cliente', 'Historial de compras', 'Puntos de fidelidad', 'WhatsApp integrado'].map(f => (
            <div key={f} className={cn('p-3 rounded-xl text-xs', darkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-50 text-gray-500')}>
              {f}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-6">Próximamente disponible · Fase 2 del roadmap</p>
      </div>
    </div>
  );
}

const MODULES: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  pos: POS,
  inventory: Inventory,
  sales: SalesHistory,
  cash: CashModule,
  reports: Reports,
  customers: Customers,
  settings: Settings,
  notifications: Notifications,
};

export default function App() {
  const { isAuthenticated, darkMode, activeModule, currentUser } = useStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  // Enforce role-based access control (RBAC) at the route loader level
  let ActiveModule = MODULES[activeModule] || Dashboard;

  if (currentUser) {
    if (currentUser.role === 'cajero' && !['pos', 'cash', 'notifications'].includes(activeModule)) {
      ActiveModule = POS;
    } else if (currentUser.role === 'gerente' && activeModule === 'settings') {
      ActiveModule = Dashboard;
    }
  }

  return (
    <div className={cn('flex h-screen overflow-hidden', darkMode ? 'bg-gray-950' : 'bg-gray-50')}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className={cn('flex-1 overflow-hidden flex flex-col', activeModule === 'pos' ? '' : '')}>
          <ActiveModule />
        </main>
      </div>
    </div>
  );
}
