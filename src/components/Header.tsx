import { Sun, Moon, Bell, Wifi } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/helpers';

const MODULE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumen general del negocio' },
  pos: { title: 'Punto de Venta', subtitle: 'Registrar ventas y cobros' },
  inventory: { title: 'Inventario', subtitle: 'Productos, stock y kardex' },
  sales: { title: 'Historial de Ventas', subtitle: 'Registro y análisis de transacciones' },
  cash: { title: 'Caja', subtitle: 'Sesiones, apertura y cierre de caja' },
  reports: { title: 'Reportes', subtitle: 'Analítica avanzada del negocio' },
  customers: { title: 'Clientes', subtitle: 'Gestión de clientes y fidelización' },
  settings: { title: 'Configuración', subtitle: 'Ajustes del sistema y empresa' },
  notifications: { title: 'Alertas', subtitle: 'Notificaciones del sistema' },
};

export default function Header() {
  const { darkMode, toggleDarkMode, activeModule, notifications, setActiveModule } = useStore();
  const unread = notifications.filter(n => !n.read).length;
  const info = MODULE_TITLES[activeModule] || { title: activeModule, subtitle: '' };

  return (
    <header className={cn(
      'flex items-center justify-between px-6 py-4 border-b flex-shrink-0',
      darkMode ? 'bg-gray-950/80 backdrop-blur border-gray-800/60' : 'bg-white/80 backdrop-blur border-gray-200'
    )}>
      <div>
        <h1 className={cn('text-xl font-bold', darkMode ? 'text-white' : 'text-gray-900')}>{info.title}</h1>
        <p className="text-sm text-gray-500">{info.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Online indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-500/20">
          <Wifi className="w-3.5 h-3.5" />
          <span>En línea</span>
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDarkMode}
          className={cn(
            'p-2.5 rounded-xl transition-colors',
            darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          )}
        >
          {darkMode ? <Sun className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setActiveModule('notifications')}
          className={cn(
            'relative p-2.5 rounded-xl transition-colors',
            darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
          )}
        >
          <Bell className="w-[18px] h-[18px]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
