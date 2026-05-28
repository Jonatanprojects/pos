import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, DollarSign,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell, Store,
  Users, FileText, Wifi, WifiOff
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/helpers';

const MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'gerente', 'supervisor'] },
  { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart, roles: ['superadmin', 'admin', 'gerente', 'supervisor', 'cajero'] },
  { id: 'inventory', label: 'Inventario', icon: Package, roles: ['superadmin', 'admin', 'gerente', 'supervisor'] },
  { id: 'sales', label: 'Historial Ventas', icon: FileText, roles: ['superadmin', 'admin', 'gerente', 'supervisor'] },
  { id: 'cash', label: 'Caja', icon: DollarSign, roles: ['superadmin', 'admin', 'gerente', 'cajero'] },
  { id: 'reports', label: 'Reportes', icon: BarChart3, roles: ['superadmin', 'admin', 'gerente'] },
  { id: 'customers', label: 'Clientes', icon: Users, roles: ['superadmin', 'admin', 'gerente'] },
  { id: 'settings', label: 'Configuración', icon: Settings, roles: ['superadmin', 'admin'] },
];

export default function Sidebar() {
  const { activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, currentUser, logout, notifications, darkMode } = useStore();
  const unread = notifications.filter(n => !n.read).length;
  const isOffline = false; // demo

  const roleColor: Record<string, string> = {
    superadmin: 'bg-red-500/20 text-red-400',
    admin: 'bg-violet-500/20 text-violet-400',
    gerente: 'bg-amber-500/20 text-amber-400',
    supervisor: 'bg-blue-500/20 text-blue-400',
    cajero: 'bg-emerald-500/20 text-emerald-400',
  };

  const roleLabel: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    gerente: 'Gerente',
    supervisor: 'Supervisor',
    cajero: 'Cajero',
  };

  const visibleMenu = MENU.filter(m => currentUser && m.roles.includes(currentUser.role));

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-300 border-r',
        sidebarCollapsed ? 'w-16' : 'w-64',
        darkMode
          ? 'bg-gray-950 border-gray-800/60'
          : 'bg-white border-gray-200'
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center p-4 border-b', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">NexusPOS</p>
              <p className="text-xs text-gray-500 truncate">{currentUser?.branch}</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-violet-500/30">
            <Store className="w-4 h-4 text-white" />
          </div>
        )}
        {!sidebarCollapsed && (
          <button onClick={toggleSidebar} className={cn('ml-2 p-1.5 rounded-lg transition-colors', darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {sidebarCollapsed && (
        <button onClick={toggleSidebar} className={cn('mx-auto mt-2 p-1.5 rounded-lg transition-colors', darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleMenu.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative',
                isActive
                  ? 'bg-violet-600/20 text-violet-400'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                sidebarCollapsed ? 'justify-center' : ''
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-violet-400' : '')} />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn('p-3 border-t space-y-2', darkMode ? 'border-gray-800/60' : 'border-gray-200')}>
        {/* Connectivity */}
        {!sidebarCollapsed && (
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs', isOffline ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400')}>
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOffline ? 'Modo offline' : 'Conectado'}</span>
          </div>
        )}

        {/* Notifications */}
        <button
          onClick={() => setActiveModule('notifications')}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative', darkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100', sidebarCollapsed ? 'justify-center' : '')}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          {!sidebarCollapsed && <span className="text-sm font-medium">Alertas</span>}
          {!sidebarCollapsed && unread > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{unread}</span>
          )}
        </button>

        {/* User */}
        {!sidebarCollapsed && currentUser && (
          <div className={cn('px-3 py-2.5 rounded-xl', darkMode ? 'bg-gray-900/60' : 'bg-gray-50')}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{currentUser.avatar}</span>
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium truncate', darkMode ? 'text-white' : 'text-gray-900')}>{currentUser.name}</p>
                <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', roleColor[currentUser.role] || 'bg-gray-500/20 text-gray-400')}>{roleLabel[currentUser.role]}</span>
              </div>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors py-1">
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        )}
        {sidebarCollapsed && (
          <button onClick={logout} title="Cerrar sesión" className={cn('w-full flex items-center justify-center py-2.5 rounded-xl transition-colors', darkMode ? 'text-gray-400 hover:bg-gray-800/60 hover:text-red-400' : 'text-gray-500 hover:bg-gray-100 hover:text-red-500')}>
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
